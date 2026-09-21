import { Plus, SignIn } from "@phosphor-icons/react";

import PartyHeader from "../components/PartyHeader";
import PartyIcon from "../components/PartyIcon";
import PartyButton from "../components/PartyButton";
import React from "react";

interface HomeProps {
  onClose: () => void;
  onCreateParty: () => void;
  onJoinParty: () => void;
}

export default function Home({
  onClose,
  onCreateParty,
  onJoinParty,
}: HomeProps) {
  return (
    <div className="party-panel-inner">
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
            icon={<Plus size={17} weight="bold" />}
            onClick={onCreateParty}
          >
            Create Party
          </PartyButton>

          <PartyButton
            variant="secondary"
            icon={<SignIn size={17} weight="regular" />}
            onClick={onJoinParty}
          >
            Join with Code
          </PartyButton>
        </div>

        <div className="party-meta">Party v0.1</div>
      </div>
    </div>
  );
}
