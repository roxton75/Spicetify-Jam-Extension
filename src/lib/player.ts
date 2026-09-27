import {
  getPlaybackState,
  subscribeToPlayback,
  PartyPlaybackState,
} from "./playback";

type MemberTrackSync = {
  partyId: string;
  stopped: boolean;
  applying: boolean;
  unsubscribe: () => void;
};

let activeSync: MemberTrackSync | null = null;

/**
 * Load the host's current Spotify track into the member's
 * own Spotify Desktop player.
 */

async function loadHostTrack(sync: MemberTrackSync, state: PartyPlaybackState) {
  if (sync.stopped || sync.applying) {
    return;
  }

  if (!state.track_uri) {
    return;
  }

  const player = Spicetify.Player;
  const currentUri = player.data?.item?.uri ?? null;

  /*
   * Same track:
   *
   * Do NOT seek again.
   * The member should continue playing naturally.
   */
  if (currentUri === state.track_uri) {
    return;
  }

  sync.applying = true;

  try {
    console.log("[Party] Loading host track:", {
      currentUri,
      hostUri: state.track_uri,
      track: state.track_name,
    });

    /*
     * Load the new track.
     */
    await player.playUri(state.track_uri);

    console.log("[SYNC TEST] MEMBER TRACK LOADED", Date.now());

    if (sync.stopped) {
      return;
    }

    /*
     * Wait until Spotify has actually switched tracks.
     */
    const startTime = Date.now();

    while (!sync.stopped && Date.now() - startTime < 5000) {
      const loadedUri = player.data?.item?.uri ?? null;

      if (loadedUri === state.track_uri) {
        break;
      }

      await new Promise<void>((resolve) => {
        window.setTimeout(resolve, 100);
      });
    }

    if (sync.stopped) {
      return;
    }

    const loadedUri = player.data?.item?.uri ?? null;

    if (loadedUri !== state.track_uri) {
      console.warn("[Party] Host track failed to load:", {
        expected: state.track_uri,
        actual: loadedUri,
      });

      return;
    }

    /*
     * Calculate where the host is RIGHT NOW.
     *
     * Example:
     *
     * Supabase stored:
     * position = 120000
     *
     * Supabase updated:
     * 2 seconds ago
     *
     * Host should now be around:
     * 122000
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
     * Clamp to track duration.
     */
    const duration = player.getDuration();

    if (duration > 0) {
      targetPosition = Math.min(targetPosition, duration);
    }

    /*
     * IMPORTANT:
     *
     * Seek only ONCE, immediately after loading
     * a NEW host track.
     */
    player.seek(Math.round(targetPosition));

    /*
     * Match host play/pause state.
     */
    // if (state.is_playing) {
    //   player.play();
    // } else {
    //   player.pause();
    // }
    if (!state.is_playing) {
      player.pause();
    }

    console.log("[Party] Member synchronized:", {
      track: state.track_name,
      position: Math.round(targetPosition),
      isPlaying: state.is_playing,
    });
  } catch (error) {
    console.error("[Party] Failed to synchronize host track:", error);
  } finally {
    sync.applying = false;
  }
}

/**
 * Fetch the current host track when the member first joins.
 */
async function loadInitialHostTrack(sync: MemberTrackSync) {
  if (sync.stopped) {
    return;
  }

  try {
    const state = await getPlaybackState(sync.partyId);

    if (!state || sync.stopped) {
      return;
    }

    await loadHostTrack(sync, state);
  } catch (error) {
    console.error("[Party] Failed to load initial host track:", error);
  }
}

/**
 * Start member-side host track synchronization.
 */
export function startMemberPlayerSync(partyId: string) {
  /*
   * Don't create duplicate synchronizers for the same party.
   */
  if (activeSync && !activeSync.stopped && activeSync.partyId === partyId) {
    return;
  }

  /*
   * Stop an old party synchronizer if one exists.
   */
  stopMemberPlayerSync();

  const sync: MemberTrackSync = {
    partyId,
    stopped: false,
    applying: false,
    unsubscribe: () => {},
  };

  activeSync = sync;

  /*
   * Load whatever the host is currently playing.
   */
  void loadInitialHostTrack(sync);

  /*
   * Listen for host track changes.
   */
  sync.unsubscribe = subscribeToPlayback(partyId, (state) => {
    console.log("[SYNC TEST] MEMBER RECEIVED", Date.now());
    if (sync.stopped) {
      return;
    }

    void loadHostTrack(sync, state);
  });

  console.log("[Party] Member track sync started:", partyId);
}

/**
 * Stop member track synchronization.
 *
 * This should only be called when the member actually leaves
 * or the party/session actually ends.
 */
export function stopMemberPlayerSync() {
  const sync = activeSync;

  if (!sync) {
    return;
  }

  sync.stopped = true;

  sync.unsubscribe();

  if (activeSync === sync) {
    activeSync = null;
  }

  console.log("[Party] Member track sync stopped:", sync.partyId);
}
