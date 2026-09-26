import {
  getPlaybackState,
  subscribeToPlayback,
  PartyPlaybackState,
} from "./playback";

const DRIFT_THRESHOLD_MS = 1500;
const SYNC_INTERVAL_MS = 3000;

type MemberPlaybackSync = {
  partyId: string;
  stopped: boolean;
  syncInProgress: boolean;
  unsubscribe: () => void;
  heartbeat: number;
};

let activeSync: MemberPlaybackSync | null = null;

async function applyPlaybackState(
  sync: MemberPlaybackSync,
  state: PartyPlaybackState,
) {
  if (sync.stopped || sync.syncInProgress) return;

  sync.syncInProgress = true;

  try {
    const player = Spicetify.Player;

    if (!state.track_uri) {
      if (player.isPlaying()) {
        player.pause();
      }

      return;
    }

    const currentUri = player.data?.item?.uri ?? null;

    /*
     * Track changed.
     *
     * We intentionally use Spotify's playUri directly.
     * There is no waitForTrack/songchange dependency here.
     */
    if (currentUri !== state.track_uri) {
      console.log("[Party] Member switching to host track:", {
        from: currentUri,
        to: state.track_uri,
        track: state.track_name,
      });

      await player.playUri(state.track_uri);

      if (sync.stopped) return;

      /*
       * Give Spotify a moment to update player.data.
       */
      await new Promise<void>((resolve) => {
        window.setTimeout(resolve, 400);
      });

      if (sync.stopped) return;
    }

    /*
     * Calculate where the host should be NOW.
     *
     * updated_at represents the position_ms snapshot on the host.
     */
    let targetPosition = Math.max(0, state.position_ms);

    if (state.is_playing) {
      const updatedAt = new Date(state.updated_at).getTime();

      if (Number.isFinite(updatedAt)) {
        const elapsed = Math.max(0, Date.now() - updatedAt);
        targetPosition += elapsed;
      }
    }

    /*
     * Don't seek past the local track duration.
     */
    const duration = player.getDuration();

    if (duration > 0) {
      targetPosition = Math.min(targetPosition, duration);
    }

    /*
     * Correct playback position.
     */
    const localPosition = player.getProgress();
    const drift = targetPosition - localPosition;

    if (Math.abs(drift) > DRIFT_THRESHOLD_MS) {
      player.seek(targetPosition);
    }

    /*
     * Correct play/pause state.
     */
    const localPlaying = player.isPlaying();

    if (state.is_playing && !localPlaying) {
      player.play();
    } else if (!state.is_playing && localPlaying) {
      player.pause();
    }
  } catch (error) {
    console.error("[Party] Failed to apply host playback:", error);
  } finally {
    sync.syncInProgress = false;
  }
}

async function syncCurrentState(sync: MemberPlaybackSync) {
  if (sync.stopped) return;

  try {
    const state = await getPlaybackState(sync.partyId);

    if (!state || sync.stopped) return;

    await applyPlaybackState(sync, state);
  } catch (error) {
    console.error("[Party] Member playback sync failed:", error);
  }
}

export function startMemberPlayerSync(partyId: string) {
  /*
   * If this party already has a running sync,
   * DO NOT create another one.
   */
  if (activeSync && !activeSync.stopped && activeSync.partyId === partyId) {
    return () => {
      /*
       * React cleanup must NOT destroy the persistent sync.
       *
       * The party lifecycle owns the actual cleanup.
       */
    };
  }

  /*
   * If another party somehow has an old sync,
   * terminate it before starting this one.
   */
  stopMemberPlayerSync();

  const sync: MemberPlaybackSync = {
    partyId,
    stopped: false,
    syncInProgress: false,
    unsubscribe: () => {},
    heartbeat: 0,
  };

  activeSync = sync;

  /*
   * Initial state.
   */
  void syncCurrentState(sync);

  /*
   * Realtime updates.
   *
   * This subscription belongs to the party sync,
   * not to a React render.
   */
  sync.unsubscribe = subscribeToPlayback(partyId, (state) => {
    if (sync.stopped) return;

    void applyPlaybackState(sync, state);
  });

  /*
   * Safety heartbeat.
   *
   * Even if a realtime event is missed, the member
   * will resynchronize within a few seconds.
   */
  sync.heartbeat = window.setInterval(() => {
    void syncCurrentState(sync);
  }, SYNC_INTERVAL_MS);

  console.log("[Party] Member player sync started:", partyId);

  /*
   * IMPORTANT:
   *
   * The returned cleanup is intentionally a no-op.
   * React must not own this lifecycle.
   */
  return () => {};
}

export function stopMemberPlayerSync() {
  const sync = activeSync;

  if (!sync) return;

  sync.stopped = true;

  window.clearInterval(sync.heartbeat);

  sync.unsubscribe();

  if (activeSync === sync) {
    activeSync = null;
  }

  console.log("[Party] Member player sync stopped:", sync.partyId);
}
