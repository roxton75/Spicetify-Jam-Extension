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
  uri?: string;
  uid?: string | null;
  metadata?: Record<string, string | undefined>;
}

interface SpotifyQueue {
  nextTracks?: SpotifyQueueTrack[];
  prevTracks?: SpotifyQueueTrack[];
  queueRevision?: string;
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

function normalizeTrack(track: SpotifyQueueTrack): PartyQueueItem | null {
  const metadata = track.metadata ?? {};

  const trackUri = track.uri ?? metadata.uri ?? null;

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

  const tracks: PartyQueueItem[] = [];

  for (const track of nextTracks) {
    const normalized = normalizeTrack(track);

    if (!normalized) continue;

    normalized.position = tracks.length;

    tracks.push(normalized);
  }

  return {
    revision: queue?.queueRevision ?? null,
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

export function startHostQueueSync(partyId: string) {
  let stopped = false;
  let updateInProgress = false;
  let lastQueueRevision: string | null = null;

  const syncQueue = async (force = false) => {
    if (stopped || updateInProgress) return;

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
