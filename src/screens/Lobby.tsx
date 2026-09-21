import React from "react";
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
  onBack: () => void;
  partyCode?: string;
}

interface PartyMember {
  id: string;
  name: string;
  isHost: boolean;
  isCurrentUser: boolean;
}

const mockMembers: PartyMember[] = [
  {
    id: "1",
    name: "You",
    isHost: true,
    isCurrentUser: true,
  },
  {
    id: "2",
    name: "Waiting for friends...",
    isHost: false,
    isCurrentUser: false,
  },
];

export default function Lobby({ onBack, partyCode = "ABC123" }: LobbyProps) {
  const [copied, setCopied] = React.useState(false);

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
          <button className="party-back" aria-label="Back" onClick={onBack}>
            <ArrowLeft size={18} weight="bold" />
          </button>

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

              <span>{mockMembers.length} people</span>
            </div>

            <div className="party-live-status">
              <span className="party-live-dot" />
              Live
            </div>
          </div>

          <div className="party-members">
            {mockMembers.map((member) => (
              <div className="party-member" key={member.id}>
                <div className="party-member-avatar">
                  {member.isCurrentUser ? (
                    <User size={17} weight="regular" />
                  ) : (
                    <HourglassIcon size={17} weight="regular" />
                  )}
                </div>

                <div className="party-member-info">
                  <div className="party-member-name">{member.name}</div>

                  {member.isHost && (
                    <div className="party-member-role">
                      {/* <Crown size={12} weight="fill" /> */}
                      Host
                    </div>
                  )}
                </div>

                {member.isCurrentUser && (
                  <div className="party-member-you">You</div>
                )}
              </div>
            ))}
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
    </div>
  );
}
