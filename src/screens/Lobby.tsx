import React from "react";
import { useEffect } from "react";
import { supabase } from "../lib/supabase";

import {
  touchParty,
  getPartyMembers,
  PartyMember,
  endParty,
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
}

export default function Lobby({ onBack, partyId, partyCode }: LobbyProps) {
  const [copied, setCopied] = React.useState(false);
  const [members, setMembers] = React.useState<PartyMember[]>([]);
  const [currentUserId, setCurrentUserId] = React.useState<string | null>(null);
  const [ending, setEnding] = React.useState(false);

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

      onBack();
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
                      {isCurrentUser
                        ? "You"
                        : (member.display_name ?? "Unknown User")}
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

        {/* Connection */}

        {/* <div className="party-connection">
          <WifiHigh size={14} weight="regular" />

          <span>Party is active</span>
        </div> */}
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
