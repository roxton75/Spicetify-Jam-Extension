import { Plus, SignIn } from "@phosphor-icons/react";

import PartyHeader from "../components/PartyHeader";
import PartyIcon from "../components/PartyIcon";
import PartyButton from "../components/PartyButton";
import React from "react";

// Home-specific styles. Shared/global styles live in ../styles/party.css.
const HOME_STYLES = `
/* =========================================================
   PARTY META
   ========================================================= */

.party-meta {
  width: 100%;
  color: #6a6a6a;
  text-align: center;
  margin-bottom: 24px;
  font-size: 12px;
}
`;

interface HomeProps {
  onClose: () => void;
  onCreateParty: () => Promise<void>;
  onJoinParty: () => void;
}

export default function Home({
  onClose,
  onCreateParty,
  onJoinParty,
}: HomeProps) {
  const [creatingParty, setCreatingParty] = React.useState(false);

  async function handleCreateParty() {
    if (creatingParty) return;

    setCreatingParty(true);

    try {
      await onCreateParty();
    } catch (error) {
      console.error("[Party] Create party failed:", error);
      setCreatingParty(false);
    }
  }

  return (
    <div className="party-panel-inner">
      <style>{HOME_STYLES}</style>

      <PartyHeader title="Party" onClose={onClose} />

      <div className="party-content">
        <PartyIcon />

        <h3>Listen together.</h3>

        <p className="party-description">
          Create a party and invite your friends to listen together.
        </p>

        <div className="party-actions">
          <PartyButton
            variant="primary"
            icon={creatingParty ? null : <Plus size={17} weight="bold" />}
            onClick={handleCreateParty}
            disabled={creatingParty}
          >
            {creatingParty ? "Creating..." : "Create Party"}
          </PartyButton>

          <PartyButton
            variant="secondary"
            icon={<SignIn size={17} weight="regular" />}
            onClick={onJoinParty}
            disabled={creatingParty}
          >
            Join with Code
          </PartyButton>
        </div>
      </div>

      <div className="party-meta">Party v0.1</div>
    </div>
  );
}
