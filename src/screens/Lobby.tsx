import React from "react";
import { useEffect } from "react";
import { supabase } from "../lib/supabase";

import {
  touchParty,
  getPartyMembers,
  PartyMember,
  endParty,
  getPartySession,
  expirePartySession,
} from "../lib/party";

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
  const [ending, setEnding] = React.useState(false);
  const [soloSince, setSoloSince] = React.useState<string | null>(null);
  const [remainingSeconds, setRemainingSeconds] = React.useState<number | null>(
    null,
  );
  const timerExpiredRef = React.useRef(false);
  const expiryRequestRef = React.useRef(false);
  const expiryRetryTimeoutRef = React.useRef<number | null>(null);

  useEffect(() => {
    let active = true;

    const loadCurrentUser = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (active) {
        setCurrentUserId(session?.user.id ?? null);
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

      // Server says the 3-minute threshold has not
      // been reached yet. Retry after one second.
      expiryRequestRef.current = false;

      expiryRetryTimeoutRef.current = window.setTimeout(() => {
        expiryRetryTimeoutRef.current = null;
        void handleTimerExpired();
      }, 1000);
    } catch (error) {
      console.error("[Party] Failed to expire party:", error);

      expiryRequestRef.current = false;

      expiryRetryTimeoutRef.current = window.setTimeout(() => {
        expiryRetryTimeoutRef.current = null;
        void handleTimerExpired();
      }, 1000);
    }
  }

  useEffect(() => {
    return () => {
      if (expiryRetryTimeoutRef.current !== null) {
        window.clearTimeout(expiryRetryTimeoutRef.current);
        expiryRetryTimeoutRef.current = null;
      }
    };
  }, []);

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

  // async function handleEndSession() {
  //   if (ending) return;

  //   setEnding(true);

  //   try {
  //     await endParty(partyId);

  //     console.log("[Party] Session ended:", partyId);

  //     onBack();
  //   } catch (error) {
  //     console.error("[Party] Failed to end session:", error);

  //     Spicetify.showNotification("Party: Failed to end session");

  //     setEnding(false);
  //   }
  // }
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

          <div className="party-playback-empty">
            <div className="party-playback-icon">
              <VinylRecordIcon size={22} weight="fill" />
            </div>

            <div className="party-playback-title">Nothing playing</div>

            <div className="party-playback-description">
              Start playing a song in Spotify to share it with the party.
            </div>
          </div>
        </div>

        {/* End Party Session*/}
      </div>
      <div className="party-end-session">
        <button
          className="party-end-session-button"
          onClick={handleEndSession}
          disabled={ending}
        >
          {ending ? "Ending..." : "End Session"}
        </button>
      </div>
    </div>
  );
}
