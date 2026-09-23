import React, { ReactNode } from "react";

interface PartyButtonProps {
  variant: "primary" | "secondary";
  icon: ReactNode;
  children: ReactNode;
  onClick: () => void;
  disabled?: boolean;
}

export default function PartyButton({
  variant,
  icon,
  children,
  onClick,
  disabled = false,
}: PartyButtonProps) {
  return (
    <button
      className={`party-button party-${variant}`}
      onClick={onClick}
      disabled={disabled}
    >
      {icon}
      <span>{children}</span>
    </button>
  );
}
