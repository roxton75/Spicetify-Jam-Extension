import { supabase } from "./supabase";
import { getOrCreateSession } from "./auth";

export interface PartyPlaybackState {
  party_id: string;

  track_uri: string | null;
  track_name: string | null;
  artist_name: string | null;
  album_name: string | null;
  artwork_url: string | null;

  is_playing: boolean;

  position_ms: number;
  duration_ms: number;

  updated_at: string;
  updated_by: string | null;
}

/**
 * Resolve Spotify's internal image URI into a real CDN URL.
 *
 * Example:
 *
 * spotify:image:ab67616d00001e024de0eb90195639855b795f4e
 *
 * becomes:
 *
 * https://i.scdn.co/image/ab67616d00001e024de0eb90195639855b795f4e
 */
function resolveSpotifyImageUrl(imageUri: string | null): string | null {
  if (!imageUri) {
    return null;
  }

  // Already a normal URL.
  if (!imageUri.startsWith("spotify:image:")) {
    return imageUri;
  }

  const imageId = imageUri.replace("spotify:image:", "");

  if (!imageId) {
    return null;
  }

  return `https://i.scdn.co/image/${imageId}`;
}

/**
 * Get the currently rendered Spotify album artwork.
 *
 * Spotify itself resolves the internal spotify:image: reference
 * and places the actual CDN URL into the Now Playing artwork <img>.
 */
function getCurrentArtworkUrl(metadata: any): string | null {
  /*
   * Primary method:
   *
   * Use Spotify's already-resolved artwork URL from the DOM.
   */
  const domArtwork =
    document.querySelector<HTMLImageElement>(".cover-art img")?.src;

  if (domArtwork) {
    return domArtwork;
  }

  /*
   * Fallback:
   *
   * Use Spicetify metadata if the artwork has not been
   * rendered into the DOM yet.
   */
  const metadataArtwork =
    metadata.image_xlarge_url ??
    metadata.image_large_url ??
    metadata.image_url ??
    null;

  return resolveSpotifyImageUrl(metadataArtwork);
}

/**
 * Get the current playback state for a party.
 */
export async function getPlaybackState(
  partyId: string,
): Promise<PartyPlaybackState | null> {
  await getOrCreateSession();

  const { data, error } = await supabase
    .from("party_playback_state")
    .select("*")
    .eq("party_id", partyId)
    .maybeSingle();

  if (error) {
    console.error("[Party] Failed to load playback state:", error);

    throw error;
  }

  return data as PartyPlaybackState | null;
}

/**
 * Publish the host's current Spotify playback state.
 */
export async function updatePlaybackState(
  state: Omit<PartyPlaybackState, "updated_at" | "updated_by">,
): Promise<void> {
  const session = await getOrCreateSession();

  const { error } = await supabase.from("party_playback_state").upsert(
    {
      ...state,
      updated_by: session.user.id,
      updated_at: new Date().toISOString(),
    },
    {
      onConflict: "party_id",
    },
  );

  if (error) {
    console.error("[Party] Failed to update playback state:", error);

    throw error;
  }
}

/**
 * Subscribe to playback changes for a party.
 */
export function subscribeToPlayback(
  partyId: string,
  onChange: (state: PartyPlaybackState) => void,
) {
  const channel = supabase
    .channel(`party-playback-${partyId}`)
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "party_playback_state",
        filter: `party_id=eq.${partyId}`,
      },
      (payload) => {
        console.log("[Party] Playback change:", payload);

        if (payload.new) {
          const playbackState = payload.new as PartyPlaybackState;

          console.log("[Party DEBUG] Sending playback state to member:", {
            partyId,
            track_uri: playbackState.track_uri,
            track_name: playbackState.track_name,
            is_playing: playbackState.is_playing,
          });

          onChange(playbackState);
        }
      },
    )
    .subscribe((status) => {
      console.log("[Party] Playback realtime status:", status);
    });

  return () => {
    supabase.removeChannel(channel);
  };
}

/**
 * Start publishing the host's Spotify playback state.
 *
 * Returns a cleanup function that removes all listeners
 * and stops the heartbeat.
 */
export function startHostPlaybackSync(partyId: string) {
  let stopped = false;
  let updateInProgress = false;

  const publishPlayback = async () => {
    if (stopped || updateInProgress) {
      return;
    }

    updateInProgress = true;

    try {
      const player = Spicetify.Player;
      const data = player.data as any;

      const item = data?.item ?? data?.track;

      /*
       * No track currently loaded.
       */
      if (!item) {
        await updatePlaybackState({
          party_id: partyId,

          track_uri: null,
          track_name: null,
          artist_name: null,
          album_name: null,
          artwork_url: null,

          is_playing: false,

          position_ms: 0,
          duration_ms: 0,
        });

        return;
      }

      const metadata = item.metadata ?? item;

      /*
       * Track information.
       */
      const trackUri = item.uri ?? metadata.uri ?? null;

      const trackName = metadata.title ?? metadata.name ?? item.name ?? null;

      const artistName =
        metadata.artist_name ?? metadata.artist ?? item.artist_name ?? null;

      const albumName =
        metadata.album_name ?? metadata.album ?? item.album_name ?? null;

      /*
       * Artwork.
       *
       * First try Spotify's actual rendered CDN URL.
       *
       * Example:
       * https://i.scdn.co/image/ab67616d...
       *
       * If the DOM image is not available yet, fall back
       * to Spicetify's internal image metadata and resolve it.
       */
      const artworkUrl = getCurrentArtworkUrl(metadata);

      /*
       * Playback state.
       */
      const isPlaying = player.isPlaying();

      const positionMs = player.getProgress();

      const durationMs = player.getDuration();

      /*
       * Publish to Supabase.
       */
      await updatePlaybackState({
        party_id: partyId,

        track_uri: trackUri,
        track_name: trackName,
        artist_name: artistName,
        album_name: albumName,

        // Always store the resolved CDN URL here.
        artwork_url: artworkUrl,

        is_playing: isPlaying,

        position_ms: Math.max(0, Math.round(positionMs)),

        duration_ms: Math.max(0, Math.round(durationMs)),
      });

      console.log("[Party] Playback synced:", {
        trackName,
        artistName,
        artworkUrl,
        isPlaying,
        positionMs,
        durationMs,
      });
    } catch (error) {
      console.error("[Party] Failed to sync playback:", error);
    } finally {
      updateInProgress = false;
    }
  };

  /*
   * Track changed.
   */
  const handleSongChange = () => {
    void publishPlayback();
  };

  /*
   * Play / pause changed.
   */
  const handlePlayPause = () => {
    void publishPlayback();
  };

  /*
   * Initial state.
   */
  void publishPlayback();

  /*
   * Spotify events.
   */
  Spicetify.Player.addEventListener("songchange", handleSongChange);

  Spicetify.Player.addEventListener("onplaypause", handlePlayPause);

  /*
   * We intentionally do NOT write to Supabase
   * on every onprogress event.
   *
   * Instead, publish a snapshot every 5 seconds.
   */
  const heartbeat = window.setInterval(() => {
    void publishPlayback();
  }, 5000);

  /*
   * Cleanup.
   */
  return () => {
    stopped = true;

    Spicetify.Player.removeEventListener("songchange", handleSongChange);

    Spicetify.Player.removeEventListener("onplaypause", handlePlayPause);

    window.clearInterval(heartbeat);

    console.log("[Party] Host playback sync stopped.");
  };
}
