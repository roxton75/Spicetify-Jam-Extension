import React from "react";

// @ts-expect-error CSS imports are handled at build time.
import "./party.css";

import Home from "./screens/Home";
import CreateParty from "./screens/CreateParty";
import JoinParty from "./screens/JoinParty";
import Lobby from "./screens/Lobby";

async function main() {
  // Wait for Spicetify Playbar
  while (!Spicetify?.Playbar) {
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  let partyOpen = false;

  let currentScreen: "home" | "create-party" | "join-party" | "lobby" = "home";

  let partyButton: HTMLButtonElement | null = null;

  function updatePartyButton() {
    if (!partyButton) {
      return;
    }

    partyButton.classList.toggle("party-button-active", partyOpen);
  }

  function getSidebar(): HTMLElement | null {
    return document.getElementById("Desktop_PanelContainer_Id");
  }

  // function createPartyPanel() {
  //   const sidebar = getSidebar();

  //   if (!sidebar) {
  //     Spicetify.showNotification("Party: Right sidebar not found");

  //     console.error("[Party] Desktop_PanelContainer_Id not found");

  //     return;
  //   }

  //   // Don't create it twice
  //   if (document.getElementById("party-panel")) {
  //     return;
  //   }

  //   const panel = document.createElement("div");

  //   panel.id = "party-panel";

  //   sidebar.appendChild(panel);

  //   // Render React application
  //   Spicetify.ReactDOM.createRoot(panel).render(
  //     <Home
  //       onClose={closeParty}
  //       onCreateParty={() => {
  //         Spicetify.showNotification("Create Party clicked!");
  //       }}
  //       onJoinParty={() => {
  //         Spicetify.showNotification("Join Party clicked!");
  //       }}
  //     />,
  //   );
  // }

  // function renderPartyScreen(panel: HTMLElement) {
  //   if (currentScreen === "home") {
  //     Spicetify.ReactDOM.createRoot(panel).render(
  //       <Home
  //         onClose={closeParty}
  //         onCreateParty={() => {
  //           currentScreen = "create-party";

  //           renderPartyScreen(panel);
  //         }}
  //         onJoinParty={() => {
  //           currentScreen = "join-party";

  //           renderPartyScreen(panel);
  //         }}
  //       />,
  //     );

  //     return;
  //   }

  //   if (currentScreen === "create-party") {
  //     Spicetify.ReactDOM.createRoot(panel).render(
  //       <CreateParty
  //         onBack={() => {
  //           currentScreen = "home";

  //           renderPartyScreen(panel);
  //         }}
  //         onCreateParty={() => {
  //           Spicetify.showNotification("Create Party clicked!");
  //         }}
  //       />,
  //     );

  //     return;
  //   }

  //   if (currentScreen === "join-party") {
  //     Spicetify.ReactDOM.createRoot(panel).render(
  //       <JoinParty
  //         onBack={() => {
  //           currentScreen = "home";

  //           renderPartyScreen(panel);
  //         }}
  //         onJoinParty={(code) => {
  //           Spicetify.showNotification(`Joining Party ${code}`);
  //         }}
  //       />,
  //     );
  //   }
  // }

  function renderPartyScreen(panel: HTMLElement) {
    if (currentScreen === "home") {
      Spicetify.ReactDOM.createRoot(panel).render(
        <Home
          onClose={closeParty}
          onCreateParty={() => {
            currentScreen = "create-party";
            renderPartyScreen(panel);
          }}
          onJoinParty={() => {
            currentScreen = "join-party";
            renderPartyScreen(panel);
          }}
        />,
      );

      return;
    }

    if (currentScreen === "create-party") {
      Spicetify.ReactDOM.createRoot(panel).render(
        <CreateParty
          onBack={() => {
            currentScreen = "home";
            renderPartyScreen(panel);
          }}
          onCreateParty={() => {
            currentScreen = "lobby";
            renderPartyScreen(panel);
          }}
        />,
      );

      return;
    }

    if (currentScreen === "join-party") {
      Spicetify.ReactDOM.createRoot(panel).render(
        <JoinParty
          onBack={() => {
            currentScreen = "home";
            renderPartyScreen(panel);
          }}
          onJoinParty={(code) => {
            currentScreen = "lobby";
            renderPartyScreen(panel);
          }}
        />,
      );

      return;
    }

    if (currentScreen === "lobby") {
      Spicetify.ReactDOM.createRoot(panel).render(
        <Lobby
          partyCode="ABC123"
          onBack={() => {
            currentScreen = "home";
            renderPartyScreen(panel);
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

    if (panel) {
      panel.style.display = "block";

      partyOpen = true;

      updatePartyButton();
    }
  }

  function closeParty() {
    const panel = document.getElementById("party-panel");

    if (panel) {
      panel.remove();
    }

    currentScreen = "home";

    partyOpen = false;

    updatePartyButton();
  }

  function toggleParty() {
    if (partyOpen) {
      closeParty();
    } else {
      openParty();
    }
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

    button.textContent = "Party Mode";

    button.setAttribute("aria-label", "Spotify Party");

    button.addEventListener("click", () => {
      toggleParty();
    });

    nowPlayingBar.appendChild(button);

    partyButton = button;

    updatePartyButton();
  }

  createPartyButton();

  console.log("[Party] Extension loaded");
}

export default main;
