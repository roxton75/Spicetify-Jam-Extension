import { supabase } from "./supabase";
import { getOrCreateSession } from "./auth";

export interface PartyQueueItem {
  position: number;
  track_uri: string;
  track_name: string;
  artist_name: string | null;
  album_name: string | null;
  artwork_url: string | null;
  duration_ms: number;
}

interface SpotifyQueueTrack {
  contextTrack?: {
    uri?: string;
    uid?: string | null;
    metadata?: Record<string, string | undefined>;
  };
  removed?: unknown[];
  blocked?: unknown[];
  provider?: string;
}

interface SpotifyQueue {
  nextTracks?: SpotifyQueueTrack[];
  prevTracks?: SpotifyQueueTrack[];
  queueRevision?: string | bigint;
  track?: SpotifyQueueTrack;
}

function resolveSpotifyImageUrl(imageUri: string | null): string | null {
  if (!imageUri) return null;

  if (!imageUri.startsWith("spotify:image:")) {
    return imageUri;
  }

  const imageId = imageUri.replace("spotify:image:", "");

  return `https://i.scdn.co/image/${imageId}`;
}

// function normalizeTrack(track: SpotifyQueueTrack): PartyQueueItem | null {
//   // Only synchronize tracks explicitly added to Spotify's queue.
//   if (track.provider !== "queue") {
//     return null;
//   }

//   const contextTrack = track.contextTrack;

//   if (!contextTrack) {
//     return null;
//   }

//   const metadata = contextTrack.metadata ?? {};

//   const trackUri = contextTrack.uri ?? metadata.uri ?? null;

//   if (!trackUri) {
//     return null;
//   }

//   const trackName = metadata.title ?? metadata.name ?? "Unknown track";

//   const artistName = metadata.artist_name ?? metadata.artist ?? null;

//   const albumName =
//     metadata.album_title ?? metadata.album_name ?? metadata.album ?? null;

//   const artworkUrl = resolveSpotifyImageUrl(
//     metadata.image_xlarge_url ??
//       metadata.image_large_url ??
//       metadata.image_url ??
//       null,
//   );

//   const durationMs = Number(metadata.duration ?? 0);

//   return {
//     position: 0,
//     track_uri: trackUri,
//     track_name: trackName,
//     artist_name: artistName,
//     album_name: albumName,
//     artwork_url: artworkUrl,
//     duration_ms: Number.isFinite(durationMs)
//       ? Math.max(0, Math.round(durationMs))
//       : 0,
//   };
// }
function normalizeTrack(track: SpotifyQueueTrack): PartyQueueItem | null {
  // We want both:
  // - tracks explicitly added to Spotify's queue
  // - Spotify autoplay recommendations
  //
  // Anything else should not enter the Party queue.
  if (track.provider !== "queue" && track.provider !== "autoplay") {
    return null;
  }

  const contextTrack = track.contextTrack;

  if (!contextTrack) {
    return null;
  }

  const metadata = contextTrack.metadata ?? {};

  const trackUri = contextTrack.uri ?? metadata.uri ?? null;

  if (!trackUri) {
    return null;
  }

  const trackName = metadata.title ?? metadata.name ?? "Unknown track";

  const artistName = metadata.artist_name ?? metadata.artist ?? null;

  const albumName =
    metadata.album_title ?? metadata.album_name ?? metadata.album ?? null;

  const artworkUrl = resolveSpotifyImageUrl(
    metadata.image_xlarge_url ??
      metadata.image_large_url ??
      metadata.image_url ??
      null,
  );

  const durationMs = Number(metadata.duration ?? 0);

  return {
    position: 0,
    track_uri: trackUri,
    track_name: trackName,
    artist_name: artistName,
    album_name: albumName,
    artwork_url: artworkUrl,
    duration_ms: Number.isFinite(durationMs)
      ? Math.max(0, Math.round(durationMs))
      : 0,
  };
}

export async function getHostQueue(): Promise<{
  revision: string | null;
  tracks: PartyQueueItem[];
}> {
  const queue = Spicetify.Queue as SpotifyQueue;

  const nextTracks = queue?.nextTracks ?? [];

  const manualTracks: PartyQueueItem[] = [];
  const autoplayTracks: PartyQueueItem[] = [];

  for (const track of nextTracks) {
    const normalized = normalizeTrack(track);

    if (!normalized) {
      continue;
    }

    if (track.provider === "queue") {
      manualTracks.push(normalized);
    } else if (track.provider === "autoplay") {
      autoplayTracks.push(normalized);
    }
  }

  /*
   * Party queue priority:
   *
   * 1. Most recently manually queued track
   * 2. Older manually queued tracks
   * 3. Spotify autoplay recommendations
   *
   * Manual tracks are reversed because Spotify exposes
   * them in oldest → newest order.
   *
   * Autoplay tracks keep Spotify's original order.
   */
  const orderedTracks = [...manualTracks.reverse(), ...autoplayTracks];

  const tracks = orderedTracks.map((track, index) => ({
    ...track,
    position: index,
  }));

  return {
    revision: queue?.queueRevision != null ? String(queue.queueRevision) : null,
    tracks,
  };
}

export async function publishPartyQueue(
  partyId: string,
  tracks: PartyQueueItem[],
): Promise<void> {
  await getOrCreateSession();

  const queuePayload = tracks.map((track) => ({
    track: {
      track_uri: track.track_uri,
      track_name: track.track_name,
      artist_name: track.artist_name,
      album_name: track.album_name,
      artwork_url: track.artwork_url,
      duration_ms: track.duration_ms,
    },
  }));

  console.log("[Party] Queue payload:", JSON.stringify(queuePayload, null, 2));

  const { error } = await supabase.rpc("replace_party_queue", {
    p_party_id: partyId,
    p_queue: queuePayload,
  });

  if (error) {
    console.error("[Party] Failed to publish queue:", error);

    throw error;
  }

  console.log(
    "[Party] Queue published:",
    tracks.map((track) => ({
      position: track.position,
      name: track.track_name,
      artist: track.artist_name,
    })),
  );
}

/* =========================================================
   MEMBER QUEUE
   ========================================================= */

export async function getPartyQueue(
  partyId: string,
): Promise<PartyQueueItem[]> {
  await getOrCreateSession();

  const { data, error } = await supabase
    .from("party_queue")
    .select(
      `
        position,
        track_uri,
        track_name,
        artist_name,
        album_name,
        artwork_url,
        duration_ms
      `,
    )
    .eq("party_id", partyId)
    .order("position", {
      ascending: true,
    });

  if (error) {
    console.error("[Party] Failed to load party queue:", error);

    throw error;
  }

  return (data ?? []) as PartyQueueItem[];
}

export function subscribeToPartyQueue(
  partyId: string,
  onChange: (queue: PartyQueueItem[]) => void,
) {
  const channel = supabase
    .channel(`party-queue-${partyId}`)
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "party_queue",
        filter: `party_id=eq.${partyId}`,
      },
      async (payload) => {
        console.log("[Party] Queue change:", payload);

        try {
          const queue = await getPartyQueue(partyId);

          onChange(queue);
        } catch (error) {
          console.error("[Party] Failed to refresh party queue:", error);
        }
      },
    )
    .subscribe((status) => {
      console.log("[Party] Queue realtime status:", status);
    });

  return () => {
    supabase.removeChannel(channel);

    console.log("[Party] Queue realtime subscription stopped.");
  };
}

/* =========================================================
   HOST QUEUE SYNC
   ========================================================= */

export function startHostQueueSync(partyId: string) {
  let stopped = false;
  let updateInProgress = false;
  let lastQueueRevision: string | null = null;

  const syncQueue = async (force = false) => {
    if (stopped || updateInProgress) {
      return;
    }

    updateInProgress = true;

    try {
      const { revision, tracks } = await getHostQueue();

      if (!force && revision === lastQueueRevision) {
        return;
      }

      await publishPartyQueue(partyId, tracks);

      lastQueueRevision = revision;

      console.log("[Party] Queue synced:", {
        revision,
        trackCount: tracks.length,
      });
    } catch (error) {
      console.error("[Party] Queue sync failed:", error);
    } finally {
      updateInProgress = false;
    }
  };

  // Initial sync
  void syncQueue(true);

  /*
   * Spicetify does not give us a dedicated
   * documented queue-change event, so we check
   * queueRevision periodically.
   *
   * We only write to Supabase when the revision
   * actually changes.
   */
  const heartbeat = window.setInterval(() => {
    void syncQueue();
  }, 3000);

  // A song change can also cause the queue state
  // to change, so check immediately.
  const handleSongChange = () => {
    void syncQueue();
  };

  Spicetify.Player.addEventListener("songchange", handleSongChange);

  return () => {
    stopped = true;

    window.clearInterval(heartbeat);

    Spicetify.Player.removeEventListener("songchange", handleSongChange);

    console.log("[Party] Host queue sync stopped.");
  };
}
