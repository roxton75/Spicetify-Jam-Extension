import React from "react";
import { syncProfile } from "./lib/profile";
import { getOrCreateSession } from "./lib/auth";
import { startHostQueueSync } from "./lib/queue";

// @ts-expect-error CSS imports are handled at build time.
import "./party.css";

import Home from "./screens/Home";
//import CreateParty from "./screens/CreateParty";
import JoinParty from "./screens/JoinParty";
import Lobby from "./screens/Lobby";

import { UsersRound } from "lucide-react";

import {
  createParty,
  getPartyMembers,
  getActiveParty,
  joinParty,
} from "./lib/party";

let extensionStarted = false;

async function main() {
  // Wait for Spicetify Playbar
  while (!Spicetify?.Playbar) {
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  if (extensionStarted) {
    console.log("[Party] Extension already initialized");
    return;
  }
  extensionStarted = true;

  let partyOpen = false;

  let partyId = "";
  let partyCode = "";
  let partyUserCount = 0;

  let activeParty: {
    partyId: string;
    partyCode: string;
  } | null = null;

  let currentScreen: "home" | "join-party" | "lobby" = "home";

  let partyButton: HTMLButtonElement | null = null;
  let partyRoot: ReturnType<typeof Spicetify.ReactDOM.createRoot> | null = null;

  let activePartyInterval: number | null = null;

  async function refreshActiveParty() {
    try {
      const party = await getActiveParty();

      if (!party) {
        activeParty = null;
        partyUserCount = 0;

        updatePartyButton();
        return;
      }

      activeParty = party;

      // Keep the local party state synchronized
      partyId = party.partyId;
      partyCode = party.partyCode;

      const members = await getPartyMembers(party.partyId);

      partyUserCount = members.length;

      updatePartyButton();

      console.log("[Party] Active party:", {
        partyId: party.partyId,
        partyCode: party.partyCode,
        members: members.length,
      });
    } catch (error) {
      console.error("[Party] Failed to refresh active party:", error);
    }
  }

  function updatePartyButton() {
    if (!partyButton) {
      return;
    }

    partyButton.classList.toggle("party-button-active", activeParty !== null);

    const left = partyButton.querySelector(
      ".party-button-left",
    ) as HTMLElement | null;

    const right = partyButton.querySelector(
      ".party-button-right",
    ) as HTMLElement | null;

    if (left) {
      left.textContent = activeParty ? `#${activeParty.partyCode}` : "—";
    }

    if (right) {
      right.innerHTML = "";

      if (activeParty) {
        const icon = document.createElement("span");

        icon.className = "party-button-users-icon";

        // Lucide SVG is rendered by React, so for this native button
        // we'll use a simple text fallback for now.
        icon.textContent = "◉";

        right.appendChild(icon);

        const text = document.createElement("span");

        text.textContent = `Users: ${partyUserCount}`;

        right.appendChild(text);
      } else {
        right.textContent = "Users: —";
      }
    }
  }

  function getSidebar(): HTMLElement | null {
    return document.getElementById("Desktop_PanelContainer_Id");
  }

  function renderPartyScreen(panel: HTMLElement) {
    if (!partyRoot) {
      partyRoot = Spicetify.ReactDOM.createRoot(panel);
    }

    if (currentScreen === "home") {
      partyRoot.render(
        <Home
          onClose={closeParty}
          onCreateParty={async () => {
            try {
              console.log("[Party] Creating party...");

              const party = await createParty();

              console.log("[Party] Created:", party);

              const members = await getPartyMembers(party.party_id);

              console.log("[Party] Members:", members);

              partyId = party.party_id;
              partyCode = party.party_code;
              partyUserCount = members.length;

              activeParty = {
                partyId: party.party_id,
                partyCode: party.party_code,
              };

              updatePartyButton();

              currentScreen = "lobby";
              renderPartyScreen(panel);
            } catch (error) {
              console.error("[Party] Failed to create party:", error);

              Spicetify.showNotification("Party: Failed to create party");
            }
          }}
          onJoinParty={() => {
            currentScreen = "join-party";
            renderPartyScreen(panel);
          }}
        />,
      );

      return;
    }

    if (currentScreen === "join-party") {
      partyRoot.render(
        <JoinParty
          onBack={() => {
            currentScreen = "home";
            renderPartyScreen(panel);
          }}
          // onJoinParty={(code) => {
          //   /*
          //    * IMPORTANT:
          //    * The real join_party() flow is not implemented here yet.
          //    *
          //    * This currently only moves the UI to the lobby.
          //    * We will replace this with the real Supabase join flow.
          //    */

          //   partyCode = code;

          //   currentScreen = "lobby";

          //   renderPartyScreen(panel);
          // }}
          onJoinParty={async (code) => {
            try {
              console.log("[Party] Joining party:", code);

              const party = await joinParty(code);

              console.log("[Party] Joined:", party);

              const members = await getPartyMembers(party.party_id);

              console.log("[Party] Members:", members);

              partyId = party.party_id;
              partyCode = party.party_code;
              partyUserCount = members.length;

              activeParty = {
                partyId: party.party_id,
                partyCode: party.party_code,
              };

              updatePartyButton();

              currentScreen = "lobby";

              renderPartyScreen(panel);
            } catch (error) {
              console.error("[Party] Failed to join party:", error);

              const message =
                error instanceof Error
                  ? error.message
                  : "Unable to join party.";

              Spicetify.showNotification(`Party: ${message}`);

              throw error;
            }
          }}
        />,
      );

      return;
    }

    if (currentScreen === "lobby") {
      partyRoot.render(
        <Lobby
          partyId={partyId}
          partyCode={partyCode}
          onBack={closeParty}
          onEndParty={() => {
            activeParty = null;
            partyId = "";
            partyCode = "";
            partyUserCount = 0;

            updatePartyButton();

            closeParty();
          }}
        />,
      );
    }
  }

  function createPartyPanel() {
    const sidebar = getSidebar();

    if (!sidebar) {
      Spicetify.showNotification("Party: Right sidebar not found");

      console.error("[Party] Desktop_PanelContainer_Id not found");

      return;
    }

    if (document.getElementById("party-panel")) {
      return;
    }

    const panel = document.createElement("div");

    panel.id = "party-panel";

    sidebar.appendChild(panel);

    renderPartyScreen(panel);
  }

  function openParty() {
    createPartyPanel();

    const panel = document.getElementById("party-panel");

    if (!panel) {
      return;
    }

    /*
     * If an active party exists, always recover directly
     * into the existing lobby.
     */
    if (activeParty) {
      partyId = activeParty.partyId;
      partyCode = activeParty.partyCode;

      currentScreen = "lobby";
    } else {
      currentScreen = "home";
    }

    renderPartyScreen(panel);

    panel.style.display = "block";

    partyOpen = true;

    updatePartyButton();
  }

  function closeParty() {
    const panel = document.getElementById("party-panel");

    if (partyRoot) {
      partyRoot.unmount();
      partyRoot = null;
    }

    if (panel) {
      panel.remove();
    }

    /*
     * Do NOT destroy the active party state here.
     *
     * The user may simply be closing the sidebar.
     * The Party button must still be able to recover
     * the active Lobby.
     */
    partyOpen = false;

    updatePartyButton();
  }

  function toggleParty() {
    if (partyOpen) {
      closeParty();
      return;
    }

    openParty();
  }

  function createPartyButton() {
    // Prevent duplicates
    if (document.getElementById("spotify-party-button")) {
      return;
    }

    const nowPlayingBar = document.querySelector(
      '[data-testid="now-playing-bar"]',
    );

    if (!nowPlayingBar) {
      console.error("[Party] Now Playing bar not found");

      return;
    }

    const button = document.createElement("button");

    button.id = "spotify-party-button";
    button.type = "button";

    button.setAttribute("aria-label", "Spotify Party");

    button.innerHTML = `
      <span class="party-button-left">#NA</span>
      <span class="party-button-center">Party Mode</span>
      <span class="party-button-right">
        Users: 0
      </span>
    `;

    button.addEventListener("click", () => {
      toggleParty();
    });

    nowPlayingBar.appendChild(button);

    partyButton = button;

    updatePartyButton();
  }

  createPartyButton();

  try {
    const profile = await syncProfile();

    console.log("[Party] Spotify profile synced:", {
      accountId: profile.spotify_account_id,
      displayName: profile.display_name,
      avatarUrl: profile.avatar_url,
    });
  } catch (error) {
    console.error("[Party] Failed to sync Spotify profile:", error);
  }

  await refreshActiveParty();

  activePartyInterval = window.setInterval(() => {
    void refreshActiveParty();
  }, 15000);

  console.log("[Party] Extension loaded");
}

export default main;
