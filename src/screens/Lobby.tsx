import React from "react";
import { useEffect } from "react";
import { supabase } from "../lib/supabase";
import { getOrCreateSession } from "../lib/auth";
import { startHostPlaybackSync } from "../lib/playback";
import PartyPlayback from "../components/PartyPlayback";
import PartyQueue from "../components/PartyQueue";
import {
  touchParty,
  getPartyMembers,
  PartyMember,
  endParty,
  getPartySession,
  expirePartySession,
  leaveParty,
} from "../lib/party";

import {
  getPartyQueue,
  subscribeToPartyQueue,
  PartyQueueItem,
} from "../lib/queue";

import { startMemberPlayerSync } from "../lib/player";

import {
  ArrowLeft,
  Copy,
  Check,
  UsersFour,
  Crown,
  MusicNote,
  WifiHigh,
  UsersIcon,
  User,
  HourglassIcon,
  VinylRecordIcon,
} from "@phosphor-icons/react";

// Lobby-specific styles. Shared/global styles live in ../styles/party.css.
const LOBBY_STYLES = `
/* =========================================================
   PARTY LOBBY
   Spotify Library-inspired visual language
   ========================================================= */

.party-lobby-content {
  flex: 1;

  overflow-y: auto;

  padding: 18px 14px 24px;

  scrollbar-width: thin;
  scrollbar-color: #4a4a4a transparent;
}

.party-lobby-content::-webkit-scrollbar {
  width: 5px;
}

.party-lobby-content::-webkit-scrollbar-track {
  background: transparent;
}

.party-lobby-content::-webkit-scrollbar-thumb {
  background: #4a4a4a;
  border-radius: 999px;
}

/* =========================================================
   PARTY CODE
   ========================================================= */

.party-code-section {
  display: flex;
  flex-direction: column;
  align-items: center;

  padding: 10px 0 20px;

  text-align: center;
}

.party-code-label {
  margin-bottom: 7px;

  color: #a7a7a7;

  font-size: 11px;
  font-weight: 700;

  letter-spacing: 0.1em;
  text-transform: uppercase;
}

.party-code-value {
  color: #ffffff;

  font-size: 27px;
  font-weight: 800;

  line-height: 1;

  letter-spacing: 0.13em;

  padding-left: 0.13em;
}

.party-copy-button {
  height: 30px;

  display: inline-flex;
  align-items: center;
  justify-content: center;

  gap: 6px;

  margin-top: 11px;

  padding: 0 12px;

  border: 0;
  border-radius: 500px;

  background: #2a2a2a;

  color: #ffffff;

  font-family: inherit;

  font-size: 13px;
  font-weight: 700;

  cursor: pointer;

  transition:
    background-color 120ms ease,
    transform 120ms ease;
}

.party-copy-button:hover {
  background: #333333;
}

.party-copy-button:active {
  transform: scale(0.97);
}

/* =========================================================
   SECTIONS
   ========================================================= */

.party-section {
  padding: 15px 0;

  border-top: 1px solid
    rgba(255, 255, 255, 0.06);
}

.party-section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;

  margin-bottom: 9px;
}

.party-section-title {
  display: flex;
  align-items: center;

  gap: 7px;

  color: #b3b3b3;

  font-size: 14px;
  font-weight: 700;
}

.party-section-title svg {
  color: #1ed760;
}

.party-session-timer {
  flex-shrink: 0;
  min-width: 52px;
  height: 28px;
  padding: 0 9px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid rgba(180, 68, 68, 0.45);
  border-radius: 999px;
  background: rgba(180, 68, 68, 0.08);
  color: #b44444;
  font-family: "Geist Mono", monospace;
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0.02em;
}

/* =========================================================
   LIVE STATUS
   ========================================================= */

.party-live-status {
  display: flex;
  align-items: center;

  gap: 5px;

  color: #a7a7a7;

  font-size: 12px;
  font-weight: 700;
}

.party-live-dot {
  width: 6px;
  height: 6px;

  flex-shrink: 0;

  border-radius: 50%;

  background: #1ed760;
}

/* =========================================================
   MEMBERS
   ========================================================= */

.party-members {
  display: flex;
  flex-direction: column;

  gap: 2px;
}

.party-member {
  min-height: 50px;

  display: flex;
  align-items: center;

  gap: 10px;

  padding: 7px 9px;

  border: 0;
  border-radius: 8px;

  background: transparent;

  transition:
    background-color 120ms ease;
}

.party-member:hover {
  background: #1f1f1f;
}

/* Avatar */

.party-member-avatar {
  width: 34px;
  height: 34px;

  display: flex;
  align-items: center;
  justify-content: center;

  flex-shrink: 0;

  border-radius: 50%;

  background: #242424;

  color: #b3b3b3;
}

.party-member-avatar-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 50%;
  display: block;
}

.party-member:first-child
.party-member-avatar {
  color: #a7a7a7;
}

/* Member information */

.party-member-info {
  min-width: 0;

  flex: 1;
}

.party-member-name {
  overflow: hidden;

  color: #ffffff;

  font-size: 14px;
  font-weight: 700;

  line-height: 1.25;

  text-overflow: ellipsis;
  white-space: nowrap;
}

.party-member-role {
  display: flex;
  align-items: center;

  gap: 4px;

  margin-top: 2px;

  color: #a7a7a7;

  font-size: 12px;
  line-height: 1;
}

.party-member-role svg {
  color: #727272;
}

.party-member-you {
  color: #727272;

  font-size: 12px;
  font-weight: 700;
}

/* =========================================================
   PLAYBACK
   ========================================================= */

.party-playback-empty {
  min-height: 118px;

  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;

  padding: 18px 14px;

  border: 0;
  border-radius: 8px;

  background: #1a1a1a;

  text-align: center;
}

.party-playback-icon {
  width: 42px;
  height: 42px;

  display: flex;
  align-items: center;
  justify-content: center;

  margin-bottom: 9px;

  border-radius: 6px;

  background: #242424;

  color: #727272;
}

.party-playback-title {
  margin-bottom: 4px;

  color: #ffffff;

  font-size: 14px;
  font-weight: 700;
}

.party-playback-description {
  max-width: 215px;

  color: #727272;

  font-size: 12px;
  line-height: 1.4;
}

.party-end-session {
  margin-top: auto;
  padding: 24px 12px 16px;
}

.party-end-session-button {
  width: 100%;
  min-height: 40px;
  border: 1px solid #B44444;
  border-radius: 500px;
  background: transparent;
  color: #B44444;
  font-family: inherit;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  transition:
    background 0.15s ease,
    color 0.15s ease,
    border-color 0.15s ease;
}

.party-end-session-button:hover {
  background: rgba(255, 255, 255, 0.08);
  color: #CA4B4B;
  border-color: #B44444;
}

.party-end-session-button:disabled {
  opacity: 0.5;
  cursor: default;
}
`;

interface LobbyProps {
  partyId: string;
  partyCode: string;
  onBack: () => void;
  onEndParty: () => void;
}

export default function Lobby({
  onBack,
  onEndParty,
  partyId,
  partyCode,
}: LobbyProps) {
  const [copied, setCopied] = React.useState(false);
  const [members, setMembers] = React.useState<PartyMember[]>([]);
  const [currentUserId, setCurrentUserId] = React.useState<string | null>(null);
  const [partyQueue, setPartyQueue] = React.useState<PartyQueueItem[]>([]);
  const [ending, setEnding] = React.useState(false);
  const [leaving, setLeaving] = React.useState(false);
  const [soloSince, setSoloSince] = React.useState<string | null>(null);
  const [remainingSeconds, setRemainingSeconds] = React.useState<number | null>(
    null,
  );
  const timerExpiredRef = React.useRef(false);
  const expiryRequestRef = React.useRef(false);

  const currentMember = members.find(
    (member) => member.user_id === currentUserId,
  );

  const isHost = currentMember?.role === "host";

  useEffect(() => {
    if (!isHost) return;

    console.log("[Party] Starting host playback sync.");

    const stopPlaybackSync = startHostPlaybackSync(partyId);

    return () => {
      stopPlaybackSync();
    };
  }, [partyId, isHost]);

  // useEffect(() => {
  //   if (isHost) {
  //     return;
  //   }

  //   console.log("[Party] Starting member player sync:", partyId);

  //   const cleanup = startMemberPlayerSync(partyId);

  //   return cleanup;
  // }, [partyId, isHost]);
  useEffect(() => {
    // Wait until we actually know the current user's role.
    if (!currentUserId || !currentMember) {
      return;
    }

    // Host uses startHostPlaybackSync instead.
    if (isHost) {
      return;
    }

    console.log("[Party] Starting member player sync:", partyId);

    const cleanup = startMemberPlayerSync(partyId);

    return cleanup;
  }, [partyId, currentUserId, currentMember, isHost]);

  useEffect(() => {
    let active = true;

    const loadCurrentUser = async () => {
      const session = await getOrCreateSession();

      if (active) {
        setCurrentUserId(session.user.id);
      }
    };

    loadCurrentUser();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    timerExpiredRef.current = false;
  }, [partyId]);

  useEffect(() => {
    const channel = supabase
      .channel(`party-members-${partyId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "party_members",
          filter: `party_id=eq.${partyId}`,
        },
        async (payload) => {
          console.log("[Party] Member change:", payload);

          try {
            const updatedMembers = await getPartyMembers(partyId);
            setMembers(updatedMembers);
          } catch (error) {
            console.error("[Party] Failed to refresh members:", error);
          }
        },
      )
      .subscribe((status) => {
        console.log("[Party] Member realtime status:", status);
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [partyId]);

  useEffect(() => {
    const channel = supabase
      .channel(`party-session-${partyId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "parties",
          filter: `id=eq.${partyId}`,
        },
        (payload) => {
          console.log("[Party] Session change:", payload);

          if (payload.new.status === "ended") {
            Spicetify.showNotification("Party: Session ended by host");
            onEndParty();
          }
        },
      )
      .subscribe((status) => {
        console.log("[Party] Session realtime status:", status);
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [partyId, onEndParty]);

  useEffect(() => {
    let active = true;

    const loadMembers = async () => {
      try {
        const members = await getPartyMembers(partyId);

        if (active) {
          setMembers(members);
        }
      } catch (error) {
        console.error("[Party] Failed to load members:", error);
      }
    };

    loadMembers();

    return () => {
      active = false;
    };
  }, [partyId]);

  useEffect(() => {
    let active = true;

    const loadPartySession = async () => {
      try {
        const session = await getPartySession(partyId);

        console.log("[Party] Session:", session);

        if (active) {
          setSoloSince(session.solo_since_at);
        }
      } catch (error) {
        console.error("[Party] Failed to load party session:", error);
      }
    };

    loadPartySession();

    const interval = window.setInterval(loadPartySession, 10_000);

    return () => {
      active = false;
      window.clearInterval(interval);
    };
  }, [partyId]);

  useEffect(() => {
    let active = true;

    const loadQueue = async () => {
      try {
        const queue = await getPartyQueue(partyId);

        if (active) {
          setPartyQueue(queue);

          console.log("[Party] Initial queue:", queue);
        }
      } catch (error) {
        console.error("[Party] Failed to load queue:", error);
      }
    };

    loadQueue();

    const unsubscribe = subscribeToPartyQueue(partyId, (queue) => {
      if (!active) return;

      setPartyQueue(queue);

      console.log("[Party] Queue received:", queue);
    });

    return () => {
      active = false;
      unsubscribe();
    };
  }, [partyId]);

  async function handleTimerExpired() {
    if (timerExpiredRef.current || expiryRequestRef.current) {
      return;
    }

    expiryRequestRef.current = true;

    try {
      const ended = await expirePartySession(partyId);

      console.log("[Party] Timer expiry result:", ended);

      if (ended) {
        timerExpiredRef.current = true;
        onEndParty();
        return;
      }
    } catch (error) {
      console.error("[Party] Failed to expire party:", error);
    } finally {
      expiryRequestRef.current = false;
    }
  }

  useEffect(() => {
    if (!soloSince || members.length !== 1) {
      setRemainingSeconds(null);
      return;
    }

    const updateTimer = () => {
      const startedAt = new Date(soloSince).getTime();
      const now = Date.now();

      const elapsedSeconds = Math.floor((now - startedAt) / 1000);

      const remaining = Math.max(180 - elapsedSeconds, 0);

      setRemainingSeconds(remaining);

      if (remaining <= 0) {
        void handleTimerExpired();
      }
    };

    updateTimer();

    const interval = window.setInterval(updateTimer, 1000);

    return () => {
      window.clearInterval(interval);
    };
  }, [soloSince, members.length]);

  useEffect(() => {
    let active = true;

    const sendHeartbeat = async () => {
      if (!active) return;

      console.log("[Party] Sending heartbeat:", partyId);

      try {
        await touchParty(partyId);
        console.log("[Party] Heartbeat sent:", partyId);
      } catch (error) {
        console.error("[Party] Heartbeat failed:", error);
      }
    };

    sendHeartbeat();

    const interval = window.setInterval(sendHeartbeat, 30_000);

    return () => {
      active = false;
      window.clearInterval(interval);
    };
  }, [partyId]);

  async function handleEndSession() {
    if (ending) return;

    setEnding(true);

    try {
      await endParty(partyId);

      console.log("[Party] Session ended:", partyId);

      // Tell app.tsx that the party itself has ended.
      // This clears activeParty and returns the Party button
      // to its inactive state.
      onEndParty();
    } catch (error) {
      console.error("[Party] Failed to end session:", error);

      Spicetify.showNotification("Party: Failed to end session");

      setEnding(false);
    }
  }

  async function handleLeaveParty() {
    if (leaving) return;

    setLeaving(true);

    try {
      await leaveParty(partyId);

      console.log("[Party] Left party:", partyId);

      onEndParty();
    } catch (error) {
      console.error("[Party] Failed to leave party:", error);

      Spicetify.showNotification("Party: Failed to leave party");

      setLeaving(false);
    }
  }

  async function handleCopyCode() {
    try {
      await navigator.clipboard.writeText(partyCode);

      setCopied(true);

      setTimeout(() => {
        setCopied(false);
      }, 1500);
    } catch {
      console.error("[Party] Failed to copy party code");
    }
  }

  return (
    <div className="party-panel-inner">
      <style>{LOBBY_STYLES}</style>

      {/* Header */}

      <div className="party-header">
        <div className="party-header-left">
          {/* <button className="party-back" aria-label="Back" onClick={onBack}>
            <ArrowLeft size={18} weight="bold" />
          </button> */}

          <div>
            <div className="party-eyebrow">Spotify Party</div>

            <h2>Party</h2>
          </div>
        </div>
        {remainingSeconds !== null && (
          <div className="party-session-timer">
            {String(Math.floor(remainingSeconds / 60)).padStart(2, "0")}:
            {String(remainingSeconds % 60).padStart(2, "0")}
          </div>
        )}
      </div>

      {/* Lobby Content */}

      <div className="party-lobby-content">
        {/* Party Code */}

        <div className="party-code-section">
          <div className="party-code-label">PARTY CODE</div>

          <div className="party-code-value">{partyCode}</div>

          <button className="party-copy-button" onClick={handleCopyCode}>
            {copied ? (
              <>
                <Check size={15} weight="bold" />

                <span>Copied</span>
              </>
            ) : (
              <>
                <Copy size={15} weight="regular" />

                <span>Copy Code</span>
              </>
            )}
          </button>
        </div>

        {/* Members */}

        <div className="party-section">
          <div className="party-section-header">
            <div className="party-section-title">
              <UsersIcon size={17} weight="bold" />

              <span>
                {members.length} {members.length === 1 ? "person" : "people"}
              </span>
            </div>

            <div className="party-live-status">
              <span className="party-live-dot" />
              Live
            </div>
          </div>

          <div className="party-members">
            {members.map((member) => {
              const isCurrentUser = member.user_id === currentUserId;
              const isHost = member.role === "host";

              return (
                <div className="party-member" key={member.user_id}>
                  <div className="party-member-avatar">
                    {member.avatar_url ? (
                      <img
                        src={member.avatar_url}
                        alt=""
                        className="party-member-avatar-image"
                      />
                    ) : (
                      <User size={17} weight="regular" />
                    )}
                  </div>

                  <div className="party-member-info">
                    <div className="party-member-name">
                      {/* {isCurrentUser
                        ? "You"
                        : (member.display_name ?? "Unknown User")} */}
                      {member.display_name ?? "Unknown User"}
                    </div>

                    {isHost && <div className="party-member-role">Host</div>}
                  </div>

                  {isCurrentUser && <div className="party-member-you">You</div>}
                </div>
              );
            })}
          </div>
        </div>

        {/* Playback */}

        <div className="party-section">
          <div className="party-section-header">
            <div className="party-section-title">
              <MusicNote size={17} weight="bold" />

              <span>Currently Playing</span>
            </div>
          </div>

          <PartyPlayback partyId={partyId} isHost={isHost} />
        </div>

        <PartyQueue queue={partyQueue} />
      </div>

      {/* End | Leave Party Session*/}
      <div className="party-end-session">
        {isHost ? (
          <button
            className="party-end-session-button"
            onClick={handleEndSession}
            disabled={ending}
          >
            {ending ? "Ending..." : "End Session"}
          </button>
        ) : (
          <button
            className="party-end-session-button"
            onClick={handleLeaveParty}
            disabled={leaving}
          >
            {leaving ? "Leaving..." : "Leave"}
          </button>
        )}
      </div>
    </div>
  );
}
