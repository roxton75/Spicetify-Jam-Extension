import { X } from "@phosphor-icons/react";
import React from "react";

interface PartyHeaderProps {
  title: string;
  onClose: () => void;
}

export default function PartyHeader({ title, onClose }: PartyHeaderProps) {
  return (
    <div className="party-header">
      <div>
        <div className="party-eyebrow">Spotify Party</div>

        <h2>{title}</h2>
      </div>

      <button
        className="party-close"
        aria-label="Close Party"
        onClick={onClose}
      >
        <X size={18} weight="bold" />
      </button>
    </div>
  );
}
