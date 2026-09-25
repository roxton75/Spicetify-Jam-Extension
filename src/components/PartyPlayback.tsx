// import React, { useEffect, useRef, useState } from "react";
// import { Pause, Play, VinylRecordIcon } from "@phosphor-icons/react";

// import {
//   getPlaybackState,
//   subscribeToPlayback,
//   PartyPlaybackState,
// } from "../lib/playback";

// interface PartyPlaybackProps {
//   partyId: string;
//   isHost: boolean;
// }

// interface ExtractedColors {
//   DARK_VIBRANT?: string;
//   DESATURATED?: string;
//   LIGHT_VIBRANT?: string;
//   PROMINENT?: string;
//   VIBRANT?: string;
//   VIBRANT_NON_ALARMING?: string;
// }

// const PLAYBACK_STYLES = `
//   .party-playback {
//     position: relative;

//     min-height: 210px;

//     overflow: hidden;

//     border-radius: 10px;

//     background: #141414;

//     isolation: isolate;
//   }

//   /* =====================================================
//      AMBIENT BACKGROUND
//      ===================================================== */

//   .party-playback-ambient {
//     position: absolute;
//     inset: -45px;

//     z-index: -2;

//     background-position: center;
//     background-repeat: no-repeat;
//     background-size: cover;

//     opacity: 0.55;

//     filter: blur(32px);

//     transform: scale(1.12);

//     transition:
//         background-image 700ms ease,
//         opacity 500ms ease;
//     }

//   .party-playback-overlay {
//     position: absolute;
//     inset: 0;

//     z-index: -1;

//     background:
//       linear-gradient(
//         to bottom,
//         rgba(0, 0, 0, 0.08) 0%,
//         rgba(0, 0, 0, 0.30) 52%,
//         rgba(0, 0, 0, 0.88) 100%
//       );
//   }

//   /* =====================================================
//      ARTWORK
//      ===================================================== */

//   .party-playback-artwork-wrap {
//     position: relative;

//     width: 220px;
//     height: 220px;

//     margin: 16px auto 12px;

//     border-radius: 8px;

//     overflow: hidden;

//     box-shadow:
//       0 12px 28px rgba(0, 0, 0, 0.45),
//       0 0 35px color-mix(
//         in srgb,
//         var(--party-playback-color) 28%,
//         transparent
//       );

//     background: #242424;

//     transition:
//       box-shadow 700ms ease,
//       transform 250ms ease;
//   }

//   .party-playback-artwork {
//     width: 100%;
//     height: 100%;

//     display: block;

//     object-fit: cover;

//     transition:
//       opacity 250ms ease,
//       transform 400ms ease;
//   }

//   .party-playback-placeholder {
//     width: 100%;
//     height: 100%;

//     display: flex;
//     align-items: center;
//     justify-content: center;

//     color: #666666;

//     background: #242424;
//   }

//   /* =====================================================
//      TRACK INFO
//      ===================================================== */

//   .party-playback-info {
//     padding: 0 14px 13px;

//     text-align: left;
//   }

//   .party-playback-track {
//     display: flex;
//     align-items: center;

//     gap: 7px;

//     min-width: 0;
//   }

//   .party-playback-state-icon {
//     flex-shrink: 0;

//     display: flex;
//     align-items: center;
//     justify-content: center;

//     color: #ffffff;
//   }

//   .party-playback-title-text {
//     min-width: 0;

//     overflow: hidden;

//     color: #ffffff;

//     font-size: 14px;
//     font-weight: 700;

//     line-height: 1.25;

//     text-overflow: ellipsis;
//     white-space: nowrap;
//   }

//   .party-playback-artist {
//     margin-top: 3px;
//     margin-left: 23px;

//     overflow: hidden;

//     color: rgba(255, 255, 255, 0.68);

//     font-size: 12px;
//     font-weight: 500;

//     line-height: 1.25;

//     text-overflow: ellipsis;
//     white-space: nowrap;
//   }

//   /* =====================================================
//      PROGRESS
//      ===================================================== */

//   .party-playback-progress {
//     display: flex;
//     align-items: center;

//     gap: 7px;

//     margin-top: 10px;
//   }

//   .party-playback-time {
//     flex-shrink: 0;

//     color: rgba(255, 255, 255, 0.58);

//     font-family: "Geist Mono", monospace;

//     font-size: 9px;
//     line-height: 1;
//   }

//   .party-playback-progress-track {
//     position: relative;

//     flex: 1;

//     height: 3px;

//     overflow: hidden;

//     border-radius: 999px;

//     background: rgba(255, 255, 255, 0.20);
//   }

//   .party-playback-progress-fill {
//     position: absolute;
//     top: 0;
//     left: 0;

//     height: 100%;

//     border-radius: inherit;

//     background: #ffffff;

//     transition: width 180ms linear;
//   }

//   /* =====================================================
//      EMPTY STATE
//      ===================================================== */

//   .party-playback-empty {
//     min-height: 210px;

//     display: flex;
//     flex-direction: column;
//     align-items: center;
//     justify-content: center;

//     padding: 20px 14px;

//     border-radius: 10px;

//     background: #1a1a1a;

//     text-align: center;
//   }

//   .party-playback-empty-icon {
//     width: 42px;
//     height: 42px;

//     display: flex;
//     align-items: center;
//     justify-content: center;

//     margin-bottom: 10px;

//     border-radius: 8px;

//     background: #242424;

//     color: #727272;
//   }

//   .party-playback-empty-title {
//     margin-bottom: 4px;

//     color: #ffffff;

//     font-size: 14px;
//     font-weight: 700;
//   }

//   .party-playback-empty-description {
//     max-width: 215px;

//     color: #727272;

//     font-size: 12px;
//     line-height: 1.4;
//   }
// `;

// function formatTime(milliseconds: number): string {
//   const totalSeconds = Math.max(0, Math.floor(milliseconds / 1000));

//   const minutes = Math.floor(totalSeconds / 60);
//   const seconds = totalSeconds % 60;

//   return `${minutes}:${String(seconds).padStart(2, "0")}`;
// }

// export default function PartyPlayback({ partyId, isHost }: PartyPlaybackProps) {
//   const [playback, setPlayback] = useState<PartyPlaybackState | null>(null);

//   const [displayPositionMs, setDisplayPositionMs] = useState(0);

//   /*
//    * Local timing references.
//    *
//    * Supabase only receives a playback snapshot every
//    * few seconds. We use these values to smoothly advance
//    * the progress bar between snapshots.
//    */
//   const basePositionRef = useRef(0);
//   const lastSyncTimeRef = useRef(Date.now());

//   /*
//    * Load initial playback state + subscribe to realtime.
//    */
//   useEffect(() => {
//     let active = true;

//     const loadPlayback = async () => {
//       try {
//         const state = await getPlaybackState(partyId);

//         if (!active) return;

//         if (state) {
//           setPlayback(state);

//           basePositionRef.current = state.position_ms;

//           lastSyncTimeRef.current = Date.now();

//           setDisplayPositionMs(state.position_ms);
//         }
//       } catch (error) {
//         console.error("[Party] Failed to load playback for UI:", error);
//       }
//     };

//     void loadPlayback();

//     const unsubscribe = subscribeToPlayback(partyId, (state) => {
//       if (!active) return;

//       setPlayback(state);

//       basePositionRef.current = state.position_ms;

//       lastSyncTimeRef.current = Date.now();

//       setDisplayPositionMs(state.position_ms);
//     });

//     return () => {
//       active = false;
//       unsubscribe();
//     };
//   }, [partyId]);

//   /*
//    * Extract the artwork color whenever the track changes.
//    */

//   /*
//    * Smooth local progress.
//    *
//    * We do not write anything to Supabase here.
//    * This is purely visual.
//    */
//   useEffect(() => {
//     if (!playback) {
//       setDisplayPositionMs(0);
//       return;
//     }

//     const updateProgress = () => {
//       if (!playback.is_playing) {
//         setDisplayPositionMs(basePositionRef.current);

//         return;
//       }

//       const elapsed = Date.now() - lastSyncTimeRef.current;

//       const nextPosition = basePositionRef.current + elapsed;

//       setDisplayPositionMs(Math.min(nextPosition, playback.duration_ms));
//     };

//     updateProgress();

//     const interval = window.setInterval(updateProgress, 250);

//     return () => {
//       window.clearInterval(interval);
//     };
//   }, [
//     playback?.track_uri,
//     playback?.is_playing,
//     playback?.position_ms,
//     playback?.duration_ms,
//   ]);

//   /*
//    * No playback state yet.
//    */
//   if (!playback) {
//     return (
//       <div className="party-playback-empty">
//         <style>{PLAYBACK_STYLES}</style>

//         <div className="party-playback-empty-icon">
//           <VinylRecordIcon size={22} weight="fill" />
//         </div>

//         <div className="party-playback-empty-title">Nothing playing</div>

//         <div className="party-playback-empty-description">
//           Start playing a song in Spotify to share it with the party.
//         </div>
//       </div>
//     );
//   }

//   /*
//    * Track exists but artwork/metadata may be
//    * temporarily unavailable.
//    */
//   const hasTrack = Boolean(playback.track_name);

//   if (!hasTrack) {
//     return (
//       <div className="party-playback-empty">
//         <style>{PLAYBACK_STYLES}</style>

//         <div className="party-playback-empty-icon">
//           <VinylRecordIcon size={22} weight="fill" />
//         </div>

//         <div className="party-playback-empty-title">Nothing playing</div>

//         <div className="party-playback-empty-description">
//           Start playing a song in Spotify to share it with the party.
//         </div>
//       </div>
//     );
//   }

//   const duration = Math.max(playback.duration_ms, 1);

//   const progress = Math.min(Math.max(displayPositionMs / duration, 0), 1) * 100;

//   return (
//     <div
//       className="party-playback"
//     >
//       <style>{PLAYBACK_STYLES}</style>

//       {/* Ambient artwork color */}
//       <div
//         className="party-playback-ambient"
//         style={{
//           backgroundImage: playback.artwork_url
//             ? `url("${playback.artwork_url}")`
//             : undefined,
//         }}
//       />

//       {/* Dark readability layer */}
//       <div className="party-playback-overlay" />

//       {/* Album artwork */}
//       <div className="party-playback-artwork-wrap">
//         {playback.artwork_url ? (
//           <img
//             className="party-playback-artwork"
//             src={playback.artwork_url}
//             alt={playback.album_name ?? playback.track_name ?? "Album artwork"}
//           />
//         ) : (
//           <div className="party-playback-placeholder">
//             <VinylRecordIcon size={32} weight="fill" />
//           </div>
//         )}
//       </div>

//       {/* Track information */}
//       <div className="party-playback-info">
//         <div className="party-playback-track">
//           <div className="party-playback-state-icon">
//             {playback.is_playing ? (
//               <Pause size={14} weight="fill" />
//             ) : (
//               <Play size={14} weight="fill" />
//             )}
//           </div>

//           <div className="party-playback-title-text">{playback.track_name}</div>
//         </div>

//         <div className="party-playback-artist">
//           {playback.artist_name ?? "Unknown artist"}
//         </div>

//         {/* Progress */}
//         <div className="party-playback-progress">
//           <span className="party-playback-time">
//             {formatTime(displayPositionMs)}
//           </span>

//           <div className="party-playback-progress-track">
//             <div
//               className="party-playback-progress-fill"
//               style={{
//                 width: `${progress}%`,
//               }}
//             />
//           </div>

//           <span className="party-playback-time">
//             {formatTime(playback.duration_ms)}
//           </span>
//         </div>
//       </div>
//     </div>
//   );
// }

import React, { useEffect, useRef, useState } from "react";
import { Pause, Play, VinylRecordIcon } from "@phosphor-icons/react";

import {
  getPlaybackState,
  subscribeToPlayback,
  PartyPlaybackState,
} from "../lib/playback";

interface PartyPlaybackProps {
  partyId: string;
  isHost: boolean;
}

const PLAYBACK_STYLES = `
  .party-playback {
    position: relative;

    min-height: 210px;

    overflow: hidden;

    border-radius: 10px;

    background: #141414;

    isolation: isolate;
  }

  /* =====================================================
     AMBIENT BACKGROUND
     ===================================================== */

  .party-playback-ambient {
    position: absolute;
    inset: -40px;

    z-index: -2;

    background-position: center;
    background-repeat: no-repeat;
    background-size: cover;

    opacity: 0.32;

    filter: blur(38px);

    transform: scale(1.15);

    transition:
      background-image 700ms ease,
      opacity 500ms ease;
  }

  .party-playback-overlay {
    position: absolute;
    inset: 0;

    z-index: -1;

    background:
      linear-gradient(
        to bottom,
        rgba(0, 0, 0, 0.12) 0%,
        rgba(0, 0, 0, 0.42) 55%,
        rgba(0, 0, 0, 0.96) 100%
      );
  }

  /* =====================================================
     ARTWORK
     ===================================================== */

  .party-playback-artwork-wrap {
    position: relative;

    width: 220px;
    height: 220px;

    margin: 16px auto 14px;

    border-radius: 8px;

    overflow: hidden;

    background: #242424;

    box-shadow:
      0 12px 28px rgba(0, 0, 0, 0.45),
      0 0 35px rgba(0, 0, 0, 0.22);

    transition:
      box-shadow 700ms ease,
      transform 250ms ease;
  }

  .party-playback-artwork {
    width: 100%;
    height: 100%;

    display: block;

    object-fit: cover;

    transition:
      opacity 250ms ease,
      transform 400ms ease;
  }

  .party-playback-placeholder {
    width: 100%;
    height: 100%;

    display: flex;
    align-items: center;
    justify-content: center;

    color: #666666;

    background: #242424;
  }

  /* =====================================================
     TRACK INFO
     ===================================================== */

  .party-playback-info {
    padding: 0 14px 13px;

    text-align: left;
  }

  .party-playback-title-text {
    min-width: 0;

    overflow: hidden;

    color: #ffffff;

    font-size: 18px;
    font-weight: 700;

    line-height: 1.2;

    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .party-playback-artist {
    margin-top: 3px;

    min-width: 0;

    overflow: hidden;

    color: rgba(255, 255, 255, 0.65);

    font-size: 14px;
    font-weight: 500;

    line-height: 1.2;

    text-overflow: ellipsis;
    white-space: nowrap;
  }

  /* =====================================================
     PROGRESS
     ===================================================== */

  .party-playback-progress {
    display: flex;
    align-items: center;

    gap: 6px;

    margin-top: 11px;
  }

  /*
   * Read-only playback state indicator.
   * This is not a control.
   */
  .party-playback-state-icon {
    flex-shrink: 0;

    width: 14px;
    height: 14px;

    display: flex;
    align-items: center;
    justify-content: center;

    color: #ffffff;
  }

  .party-playback-time {
    flex-shrink: 0;

    color: rgba(255, 255, 255, 0.55);

    font-size: 9px;
    font-weight: 500;

    line-height: 1;
  }

  .party-playback-progress-track {
    position: relative;

    flex: 1;

    height: 3px;

    overflow: hidden;

    border-radius: 999px;

    background: rgba(255, 255, 255, 0.22);
  }

  .party-playback-progress-fill {
    position: absolute;
    top: 0;
    left: 0;

    height: 100%;

    border-radius: inherit;

    background: #ffffff;

    transition: width 180ms linear;
  }

  /* =====================================================
     EMPTY STATE
     ===================================================== */

  .party-playback-empty {
    min-height: 210px;

    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;

    padding: 20px 14px;

    border-radius: 10px;

    background: #1a1a1a;

    text-align: center;
  }

  .party-playback-empty-icon {
    width: 42px;
    height: 42px;

    display: flex;
    align-items: center;
    justify-content: center;

    margin-bottom: 10px;

    border-radius: 8px;

    background: #242424;

    color: #727272;
  }

  .party-playback-empty-title {
    margin-bottom: 4px;

    color: #ffffff;

    font-size: 14px;
    font-weight: 700;
  }

  .party-playback-empty-description {
    max-width: 215px;

    color: #727272;

    font-size: 12px;
    line-height: 1.4;
  }
`;

function formatTime(milliseconds: number): string {
  const totalSeconds = Math.max(0, Math.floor(milliseconds / 1000));

  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

export default function PartyPlayback({ partyId, isHost }: PartyPlaybackProps) {
  const [playback, setPlayback] = useState<PartyPlaybackState | null>(null);

  const [displayPositionMs, setDisplayPositionMs] = useState(0);

  /*
   * Local timing references.
   *
   * Supabase only receives a playback snapshot every
   * few seconds. We use these values to smoothly advance
   * the progress bar between snapshots.
   */
  const basePositionRef = useRef(0);
  const lastSyncTimeRef = useRef(Date.now());

  /*
   * Load initial playback state + subscribe to realtime.
   */
  useEffect(() => {
    let active = true;

    const loadPlayback = async () => {
      try {
        const state = await getPlaybackState(partyId);

        if (!active) return;

        if (state) {
          setPlayback(state);

          basePositionRef.current = state.position_ms;
          lastSyncTimeRef.current = Date.now();

          setDisplayPositionMs(state.position_ms);
        }
      } catch (error) {
        console.error("[Party] Failed to load playback for UI:", error);
      }
    };

    void loadPlayback();

    const unsubscribe = subscribeToPlayback(partyId, (state) => {
      if (!active) return;

      setPlayback(state);

      basePositionRef.current = state.position_ms;
      lastSyncTimeRef.current = Date.now();

      setDisplayPositionMs(state.position_ms);
    });

    return () => {
      active = false;
      unsubscribe();
    };
  }, [partyId]);

  /*
   * Smooth local progress.
   *
   * We do not write anything to Supabase here.
   * This is purely visual.
   */
  useEffect(() => {
    if (!playback) {
      setDisplayPositionMs(0);
      return;
    }

    const updateProgress = () => {
      if (!playback.is_playing) {
        setDisplayPositionMs(basePositionRef.current);
        return;
      }

      const elapsed = Date.now() - lastSyncTimeRef.current;

      const nextPosition = basePositionRef.current + elapsed;

      setDisplayPositionMs(Math.min(nextPosition, playback.duration_ms));
    };

    updateProgress();

    const interval = window.setInterval(updateProgress, 250);

    return () => {
      window.clearInterval(interval);
    };
  }, [
    playback?.track_uri,
    playback?.is_playing,
    playback?.position_ms,
    playback?.duration_ms,
  ]);

  /*
   * No playback state yet.
   */
  if (!playback) {
    return (
      <div className="party-playback-empty">
        <style>{PLAYBACK_STYLES}</style>

        <div className="party-playback-empty-icon">
          <VinylRecordIcon size={22} weight="fill" />
        </div>

        <div className="party-playback-empty-title">Nothing playing</div>

        <div className="party-playback-empty-description">
          Start playing a song in Spotify to share it with the party.
        </div>
      </div>
    );
  }

  /*
   * Track exists but artwork/metadata may be
   * temporarily unavailable.
   */
  const hasTrack = Boolean(playback.track_name);

  if (!hasTrack) {
    return (
      <div className="party-playback-empty">
        <style>{PLAYBACK_STYLES}</style>

        <div className="party-playback-empty-icon">
          <VinylRecordIcon size={22} weight="fill" />
        </div>

        <div className="party-playback-empty-title">Nothing playing</div>

        <div className="party-playback-empty-description">
          Start playing a song in Spotify to share it with the party.
        </div>
      </div>
    );
  }

  const duration = Math.max(playback.duration_ms, 1);

  const progress = Math.min(Math.max(displayPositionMs / duration, 0), 1) * 100;

  return (
    <div className="party-playback">
      <style>{PLAYBACK_STYLES}</style>

      {/* Ambient artwork background */}
      <div
        className="party-playback-ambient"
        style={{
          backgroundImage: playback.artwork_url
            ? `url("${playback.artwork_url}")`
            : undefined,
        }}
      />

      {/* Dark readability layer */}
      <div className="party-playback-overlay" />

      {/* Album artwork */}
      <div className="party-playback-artwork-wrap">
        {playback.artwork_url ? (
          <img
            className="party-playback-artwork"
            src={playback.artwork_url}
            alt={playback.album_name ?? playback.track_name ?? "Album artwork"}
          />
        ) : (
          <div className="party-playback-placeholder">
            <VinylRecordIcon size={32} weight="fill" />
          </div>
        )}
      </div>

      {/* Track information */}
      <div className="party-playback-info">
        <div className="party-playback-title-text">{playback.track_name}</div>

        <div className="party-playback-artist">
          {playback.artist_name ?? "Unknown artist"}
        </div>

        {/* Read-only playback state + progress */}
        <div className="party-playback-progress">
          <div className="party-playback-state-icon">
            {playback.is_playing ? (
              <Pause size={13} weight="fill" />
            ) : (
              <Play size={13} weight="fill" />
            )}
          </div>

          <span className="party-playback-time">
            {formatTime(displayPositionMs)}
          </span>

          <div className="party-playback-progress-track">
            <div
              className="party-playback-progress-fill"
              style={{
                width: `${progress}%`,
              }}
            />
          </div>

          <span className="party-playback-time">
            {formatTime(playback.duration_ms)}
          </span>
        </div>
      </div>
    </div>
  );
}
