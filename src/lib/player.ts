import {
  getPlaybackState,
  subscribeToPlayback,
  PartyPlaybackState,
} from "./playback";

const DRIFT_THRESHOLD_MS = 1500;
const SYNC_INTERVAL_MS = 3000;

// function waitForTrack(trackUri: string, timeoutMs = 5000): Promise<boolean> {
//   return new Promise((resolve) => {
//     const player = Spicetify.Player;

//     const currentUri = player.data?.item?.uri ?? null;

//     if (currentUri === trackUri) {
//       resolve(true);
//       return;
//     }

//     let finished = false;

//     const finish = (success: boolean) => {
//       if (finished) return;

//       finished = true;

//       window.clearTimeout(timeout);

//       player.removeEventListener("songchange", handleSongChange);

//       resolve(success);
//     };

//     const handleSongChange = () => {
//       const loadedUri = player.data?.item?.uri ?? null;

//       if (loadedUri === trackUri) {
//         finish(true);
//       }
//     };

//     const timeout = window.setTimeout(() => {
//       finish(false);
//     }, timeoutMs);

//     player.addEventListener("songchange", handleSongChange);
//   });
// }

export function startMemberPlayerSync(partyId: string) {
  let stopped = false;
  let syncInProgress = false;

  const applyPlaybackState = async (state: PartyPlaybackState) => {
    if (stopped || syncInProgress) {
      return;
    }

    syncInProgress = true;

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
       * HOST IS PLAYING A DIFFERENT TRACK
       */
  if (currentUri !== state.track_uri) {
    console.log(
      "[Party] Member switching to host track:",
      state.track_name,
      state.artist_name,
      state.track_uri,
    );

    await player.playUri(state.track_uri);

    if (stopped) {
      return;
    }

    // Give Spotify time to update the player state.
    await new Promise((resolve) => window.setTimeout(resolve, 500));

    const loadedUri = player.data?.item?.uri ?? null;

    if (loadedUri !== state.track_uri) {
      console.warn("[Party] Host track has not loaded yet:", {
        expected: state.track_uri,
        actual: loadedUri,
      });

      // Retry once.
      await player.playUri(state.track_uri);

      if (stopped) {
        return;
      }

      await new Promise((resolve) => window.setTimeout(resolve, 500));
    }
  }

      if (stopped) {
        return;
      }

      /*
       * Calculate where the host should be NOW.
       */
      let targetPosition = state.position_ms;

      if (state.is_playing) {
        const updatedAt = new Date(state.updated_at).getTime();

        const elapsed = Date.now() - updatedAt;

        targetPosition += Math.max(0, elapsed);
      }

      const duration = player.getDuration();

      if (duration > 0) {
        targetPosition = Math.min(targetPosition, duration);
      }

      /*
       * Align member position with host.
       */
      const localPosition = player.getProgress();

      const drift = targetPosition - localPosition;

      if (Math.abs(drift) > DRIFT_THRESHOLD_MS) {
        console.log("[Party] Correcting member playback position:", {
          localPosition,
          targetPosition,
          drift,
        });

        player.seek(targetPosition);
      }

      /*
       * Align play / pause state.
       */
      const localPlaying = player.isPlaying();

      if (state.is_playing && !localPlaying) {
        player.play();
      }

      if (!state.is_playing && localPlaying) {
        player.pause();
      }

      console.log("[Party] Member playback aligned:", {
        track: state.track_name,
        position: targetPosition,
        playing: state.is_playing,
      });
    } catch (error) {
      console.error("[Party] Failed to apply host playback:", error);
    } finally {
      syncInProgress = false;
    }
  };

  /*
   * Initial synchronization.
   *
   * This is what makes a member immediately
   * switch from their current Spotify song
   * to the host's song when they join.
   */
  const loadInitialState = async () => {
    try {
      const state = await getPlaybackState(partyId);

      if (state && !stopped) {
        console.log("[Party] Initial host playback:", state);

        await applyPlaybackState(state);
      }
    } catch (error) {
      console.error("[Party] Failed to load initial host playback:", error);
    }
  };

  void loadInitialState();

  /*
   * Realtime synchronization.
   *
   * Host changes track / play / pause →
   * Supabase → member.
   */
  const unsubscribe = subscribeToPlayback(partyId, (state) => {
    if (stopped) {
      return;
    }

    void applyPlaybackState(state);
  });

  /*
   * Safety heartbeat.
   *
   * Realtime handles state changes,
   * while this corrects playback drift.
   */
  const heartbeat = window.setInterval(async () => {
    if (stopped) {
      return;
    }

    try {
      const state = await getPlaybackState(partyId);

      if (state && !stopped) {
        await applyPlaybackState(state);
      }
    } catch (error) {
      console.error("[Party] Member playback heartbeat failed:", error);
    }
  }, SYNC_INTERVAL_MS);

  return () => {
    stopped = true;

    window.clearInterval(heartbeat);

    unsubscribe();

    console.log("[Party] Member player sync stopped.");
  };
}
