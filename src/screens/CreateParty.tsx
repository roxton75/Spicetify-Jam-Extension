import React from "react";
import {
  ArrowLeft,
  UsersFour,
  ShareNetwork,
  Sparkle,
  CaretRightIcon,
} from "@phosphor-icons/react";

interface CreatePartyProps {
  onBack: () => void;
  onCreateParty: () => void;
}

export default function CreateParty({
  onBack,
  onCreateParty,
}: CreatePartyProps) {
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

            <h2>Create Party</h2>
          </div>
        </div>
      </div>

      {/* Content */}

      <div className="party-content create-party-content">
        <div className="create-party-icon">
          <UsersFour size={30} weight="regular" />
        </div>

        <h3>Create a Party</h3>

        <p className="party-description">
          Start a shared listening session and invite your friends to join.
        </p>

        <div className="create-party-info">
          <div className="create-party-info-item">
            <ShareNetwork size={18} weight="regular" />

            <span>Invite friends with a Party Code</span>
          </div>

          {/* <div className="create-party-info-item">
            <Sparkle size={18} weight="regular" />

            <span>Your Spotify profile is used automatically</span>
          </div> */}
        </div>

        <div className="party-actions create-party-actions">
          <button
            className="party-button party-primary"
            onClick={onCreateParty}
          >
            <span>Create Party</span>
            <CaretRightIcon size={17} weight="bold" />
          </button>
        </div>

        <p className="create-party-footer">
          You can invite people after creating your party.
        </p>
      </div>
    </div>
  );
}
