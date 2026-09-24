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

interface ExtractedColors {
  DARK_VIBRANT?: string;
  DESATURATED?: string;
  LIGHT_VIBRANT?: string;
  PROMINENT?: string;
  VIBRANT?: string;
  VIBRANT_NON_ALARMING?: string;
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
    inset: -35px;

    z-index: -2;

    background:
      radial-gradient(
        circle at 50% 38%,
        var(--party-playback-color) 0%,
        transparent 68%
      );

    opacity: 0.62;

    filter: blur(28px);

    transform: scale(1.08);

    transition:
      background 700ms ease,
      opacity 500ms ease;
  }

  .party-playback-overlay {
    position: absolute;
    inset: 0;

    z-index: -1;

    background:
      linear-gradient(
        to bottom,
        rgba(0, 0, 0, 0.08) 0%,
        rgba(0, 0, 0, 0.30) 52%,
        rgba(0, 0, 0, 0.88) 100%
      );
  }

  /* =====================================================
     ARTWORK
     ===================================================== */

  .party-playback-artwork-wrap {
    position: relative;

    width: 180px;
    height: 180px;

    margin: 16px auto 12px;

    border-radius: 8px;

    overflow: hidden;

    box-shadow:
      0 12px 28px rgba(0, 0, 0, 0.45),
      0 0 35px color-mix(
        in srgb,
        var(--party-playback-color) 28%,
        transparent
      );

    background: #242424;

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

  .party-playback-track {
    display: flex;
    align-items: center;

    gap: 7px;

    min-width: 0;
  }

  .party-playback-state-icon {
    flex-shrink: 0;

    display: flex;
    align-items: center;
    justify-content: center;

    color: #ffffff;
  }

  .party-playback-title-text {
    min-width: 0;

    overflow: hidden;

    color: #ffffff;

    font-size: 14px;
    font-weight: 700;

    line-height: 1.25;

    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .party-playback-artist {
    margin-top: 3px;
    margin-left: 23px;

    overflow: hidden;

    color: rgba(255, 255, 255, 0.68);

    font-size: 12px;
    font-weight: 500;

    line-height: 1.25;

    text-overflow: ellipsis;
    white-space: nowrap;
  }

  /* =====================================================
     PROGRESS
     ===================================================== */

  .party-playback-progress {
    display: flex;
    align-items: center;

    gap: 7px;

    margin-top: 10px;
  }

  .party-playback-time {
    flex-shrink: 0;

    color: rgba(255, 255, 255, 0.58);

    font-family: "Geist Mono", monospace;

    font-size: 9px;
    line-height: 1;
  }

  .party-playback-progress-track {
    position: relative;

    flex: 1;

    height: 3px;

    overflow: hidden;

    border-radius: 999px;

    background: rgba(255, 255, 255, 0.20);
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

async function extractPlaybackColor(
  trackUri: string | null,
): Promise<string | null> {
  if (!trackUri) {
    return null;
  }

  try {
    if (typeof Spicetify.colorExtractor !== "function") {
      console.warn("[Party] Spicetify.colorExtractor is unavailable.");

      return null;
    }

    const colors = (await Spicetify.colorExtractor(
      trackUri,
    )) as ExtractedColors;

    /*
     * PROMINENT gives us the main representative color.
     * DARK_VIBRANT is a useful fallback for the ambient glow.
     */
    return (
      colors.PROMINENT ??
      colors.DARK_VIBRANT ??
      colors.VIBRANT ??
      colors.DESATURATED ??
      null
    );
  } catch (error) {
    console.warn("[Party] Failed to extract artwork color:", error);

    return null;
  }
}

export default function PartyPlayback({ partyId, isHost }: PartyPlaybackProps) {
  const [playback, setPlayback] = useState<PartyPlaybackState | null>(null);

  const [displayPositionMs, setDisplayPositionMs] = useState(0);

  const [ambientColor, setAmbientColor] = useState("#242424");

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
   * Extract the artwork color whenever the track changes.
   */
  useEffect(() => {
    let active = true;

    const updateColor = async () => {
      const color = await extractPlaybackColor(playback?.track_uri ?? null);

      if (!active) return;

      setAmbientColor(color ?? "#242424");
    };

    void updateColor();

    return () => {
      active = false;
    };
  }, [playback?.track_uri]);

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
    <div
      className="party-playback"
      style={
        {
          "--party-playback-color": ambientColor,
        } as React.CSSProperties
      }
    >
      <style>{PLAYBACK_STYLES}</style>

      {/* Ambient artwork color */}
      <div className="party-playback-ambient" />

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
        <div className="party-playback-track">
          <div className="party-playback-state-icon">
            {playback.is_playing ? (
              <Pause size={14} weight="fill" />
            ) : (
              <Play size={14} weight="fill" />
            )}
          </div>

          <div className="party-playback-title-text">{playback.track_name}</div>
        </div>

        <div className="party-playback-artist">
          {playback.artist_name ?? "Unknown artist"}
        </div>

        {/* Progress */}
        <div className="party-playback-progress">
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
