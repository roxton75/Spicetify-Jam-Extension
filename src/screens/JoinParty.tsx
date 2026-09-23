import React, { useState } from "react";
import { ArrowLeft, UserPlus, ArrowRight } from "@phosphor-icons/react";

interface JoinPartyProps {
  onBack: () => void;
  onJoinParty: (code: string) => Promise<void>;
}

export default function JoinParty({ onBack, onJoinParty }: JoinPartyProps) {
  const [partyCode, setPartyCode] = useState("");
  const [joining, setJoining] = useState(false);

  function handleCodeChange(event: React.ChangeEvent<HTMLInputElement>) {
    const value = event.target.value
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, "")
      .slice(0, 6);

    setPartyCode(value);
  }

  // function handleJoin() {
  //   if (partyCode.length !== 6) {
  //     return;
  //   }

  //   onJoinParty(partyCode);
  // }
  async function handleJoin() {
    if (partyCode.length !== 6 || joining) {
      return;
    }

    setJoining(true);

    try {
      await onJoinParty(partyCode);
    } catch (error) {
      console.error("[Party] Join failed:", error);
      setJoining(false);
    }
  }

  return (
    <div className="party-panel-inner">
      {/* Header */}

      <div className="party-header">
        <div className="party-header-left">
          <div>
            {/* <button className="party-back" aria-label="Back" onClick={onBack}>
              <ArrowLeft size={18} weight="bold" />
            </button> */}
            <div className="party-eyebrow">Spotify Party</div>

            <h2>Join Party</h2>
          </div>
        </div>
      </div>

      {/* Content */}

      <div className="party-content join-party-content">
        <div className="join-party-icon">
          <UserPlus size={30} weight="regular" />
        </div>

        <h3>Join a Party</h3>

        <p className="party-description">
          Enter the Party Code shared by your friend to join their session.
        </p>

        {/* Code Input */}

        <div className="join-party-form">
          <label htmlFor="party-code" className="party-input-label">
            Party Code
          </label>

          <input
            id="party-code"
            className="party-code-input"
            type="text"
            value={partyCode}
            onChange={handleCodeChange}
            placeholder="ABC123"
            maxLength={6}
            autoComplete="off"
            spellCheck={false}
          />

          <div className="party-code-hint">
            Enter the 6-character code shared by your friend.
          </div>
        </div>

        {/* Join Button */}

        <div className="party-actions join-party-actions">
          {
            /* <button
            className="party-button party-primary"
            disabled={partyCode.length !== 6}
            onClick={handleJoin}
          >
            <span>Join Party</span>

            <ArrowRight size={17} weight="bold" />
          </button> */
            <button
              className="party-button party-primary"
              disabled={partyCode.length !== 6 || joining}
              onClick={handleJoin}
            >
              <span>{joining ? "Joining..." : "Join Party"}</span>

              {!joining && <ArrowRight size={17} weight="bold" />}
            </button>
          }
        </div>

        <button className="join-party-back-button" onClick={onBack}>
          Back
        </button>
      </div>
    </div>
  );
}
