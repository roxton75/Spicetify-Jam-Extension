import React, { useState } from "react";
import { ArrowLeft, UserPlus, ArrowRight } from "@phosphor-icons/react";

// JoinParty-specific styles. Shared/global styles live in ../styles/party.css.
const JOIN_PARTY_STYLES = `
/* =========================================================
   JOIN PARTY
   ========================================================= */

.join-party-content {
  justify-content: center;
  padding-top: 32px;
}

/* =========================================================
   JOIN PARTY ICON
   ========================================================= */

.join-party-icon {
  width: 64px;
  height: 64px;

  display: flex;
  align-items: center;
  justify-content: center;

  margin-bottom: 20px;

  border-radius: 50%;

  background: #000000;
  color: #1ed760;
}

/* =========================================================
   JOIN PARTY FORM
   ========================================================= */

.join-party-form {
  width: 100%;
  max-width: 280px;

  margin: 4px 0 20px;

  text-align: left;
}

.party-input-label {
  display: block;

  margin-bottom: 7px;

  color: #b3b3b3;

  font-size: 13px;
  font-weight: 700;
}

/* =========================================================
   PARTY CODE INPUT
   ========================================================= */

.party-code-input {
  width: 100%;
  height: 44px;

  box-sizing: border-box;

  padding: 0 14px;

  border: 1px solid #727272;
  border-radius: 0;

  outline: none;

  background: #181818;
  color: #ffffff;

  font-family: inherit;

  font-size: 16px;
  font-weight: 700;

  letter-spacing: 0.12em;

  text-align: center;

  text-transform: uppercase;

  transition:
    border-color 120ms ease,
    background-color 120ms ease;
}

.party-code-input::placeholder {
  color: #6a6a6a;
}

.party-code-input:hover {
  border-color: #a7a7a7;
}

.party-code-input:focus {
  border-color: #1ed760;
  background: #1c1c1c;
}

/* =========================================================
   CODE HINT
   ========================================================= */

.party-code-hint {
  margin-top: 7px;

  color: #6a6a6a;

  font-size: 12px;
  line-height: 1.4;

  text-align: center;
}

/* =========================================================
   JOIN BUTTON
   ========================================================= */

.join-party-actions {
  margin-top: 0;
}

.join-party-actions
.party-button {
  min-height: 42px;
}

/* Disabled */

.join-party-actions
.party-button:disabled {
  opacity: 0.4;

  cursor: not-allowed;

  transform: none;
}

.join-party-actions
.party-button:disabled:hover {
  background: #1ed760;
}

/* =========================================================
   BACK BUTTON
   ========================================================= */

.join-party-back-button {
  margin-top: 16px;

  border: 0;

  background: transparent;

  color: #b3b3b3;

  font-family: inherit;

  font-size: 14px;
  font-weight: 700;

  cursor: pointer;

  transition: color 120ms ease;
}

.join-party-back-button:hover {
  color: #ffffff;
}
`;

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
      <style>{JOIN_PARTY_STYLES}</style>

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
