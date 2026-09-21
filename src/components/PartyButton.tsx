import React, { ReactNode } from "react";

interface PartyButtonProps {
  variant: "primary" | "secondary";
  icon: ReactNode;
  children: ReactNode;
  onClick: () => void;
}

export default function PartyButton({
  variant,
  icon,
  children,
  onClick,
}: PartyButtonProps) {
  return (
    <button className={`party-button party-${variant}`} onClick={onClick}>
      {icon}
      <span>{children}</span>
    </button>
  );
}
