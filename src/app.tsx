// import React from "react";

// import { syncProfile } from "./lib/profile";
// import { getOrCreateSession } from "./lib/auth";
// import { startHostQueueSync } from "./lib/queue";

// // @ts-expect-error CSS imports are handled at build time.
// import "./party.css";

// import Home from "./screens/Home";
// import JoinParty from "./screens/JoinParty";
// import Lobby from "./screens/Lobby";

// import {
//   createParty,
//   getPartyMembers,
//   getActiveParty,
//   joinParty,
// } from "./lib/party";

// let extensionStarted = false;

// async function main() {
//   // Wait for Spicetify Playbar
//   while (!Spicetify?.Playbar) {
//     await new Promise((resolve) => setTimeout(resolve, 100));
//   }

//   if (extensionStarted) {
//     console.log("[Party] Extension already initialized");
//     return;
//   }
//   extensionStarted = true;

//   let partyOpen = false;

//   let partyId = "";
//   let partyCode = "";
//   let partyUserCount = 0;

//   let activeParty: {
//     partyId: string;
//     partyCode: string;
//   } | null = null;

//   let currentScreen: "home" | "join-party" | "lobby" = "home";

//   let partyButton: HTMLButtonElement | null = null;
//   let partyRoot: ReturnType<typeof Spicetify.ReactDOM.createRoot> | null = null;

//   let activePartyInterval: number | null = null;
//   let partyPanelObserver: MutationObserver | null = null;

//   let hostQueueCleanup: (() => void) | null = null;
//   let hostQueuePartyId: string | null = null;

//   function stopHostQueueSync() {
//     if (hostQueueCleanup) {
//       hostQueueCleanup();
//       hostQueueCleanup = null;
//     }

//     hostQueuePartyId = null;
//   }

//   async function updateHostQueueSync(
//     targetPartyId: string | null,
//     members: Awaited<ReturnType<typeof getPartyMembers>>,
//   ) {
//     if (!targetPartyId) {
//       stopHostQueueSync();
//       return;
//     }

//     const session = await getOrCreateSession();

//     const currentMember = members.find(
//       (member) => member.user_id === session.user.id,
//     );

//     const isHost = currentMember?.role === "host";

//     if (!isHost) {
//       stopHostQueueSync();
//       return;
//     }

//     // Already syncing this party.
//     if (hostQueuePartyId === targetPartyId && hostQueueCleanup) {
//       return;
//     }

//     stopHostQueueSync();

//     hostQueuePartyId = targetPartyId;
//     hostQueueCleanup = startHostQueueSync(targetPartyId);

//     console.log("[Party] Host queue sync started:", targetPartyId);
//   }

//   async function refreshActiveParty() {
//     try {
//       const party = await getActiveParty();

//       if (!party) {
//         activeParty = null;
//         partyUserCount = 0;

//         stopHostQueueSync();

//         updatePartyButton();
//         return;
//       }

//       activeParty = party;

//       // Keep the local party state synchronized
//       partyId = party.partyId;
//       partyCode = party.partyCode;

//       const members = await getPartyMembers(party.partyId);

//       partyUserCount = members.length;

//       await updateHostQueueSync(party.partyId, members);

//       updatePartyButton();

//       console.log("[Party] Active party:", {
//         partyId: party.partyId,
//         partyCode: party.partyCode,
//         members: members.length,
//       });
//     } catch (error) {
//       console.error("[Party] Failed to refresh active party:", error);
//     }
//   }

//   function updatePartyButton() {
//     if (!partyButton) {
//       return;
//     }

//     partyButton.classList.toggle("party-button-active", activeParty !== null);

//     const left = partyButton.querySelector(
//       ".party-button-left",
//     ) as HTMLElement | null;

//     const right = partyButton.querySelector(
//       ".party-button-right",
//     ) as HTMLElement | null;

//     if (left) {
//       left.textContent = activeParty ? `#${activeParty.partyCode}` : "—";
//     }

//     if (right) {
//       right.innerHTML = "";

//       if (activeParty) {
//         const icon = document.createElement("span");

//         icon.className = "party-button-users-icon";

//         // Lucide SVG is rendered by React, so for this native button
//         // we'll use a simple text fallback for now.
//         icon.textContent = "◉";

//         right.appendChild(icon);

//         const text = document.createElement("span");

//         text.textContent = `Users: ${partyUserCount}`;

//         right.appendChild(text);
//       } else {
//         right.textContent = "Users: —";
//       }
//     }
//   }

//   function getSidebar(): HTMLElement | null {
//     return document.getElementById("Desktop_PanelContainer_Id");
//   }

//   function startPartyPanelObserver() {
//     if (partyPanelObserver) {
//       return;
//     }

//     partyPanelObserver = new MutationObserver(() => {
//       if (!partyOpen) {
//         return;
//       }

//       const panel = document.getElementById("party-panel");

//       if (panel) {
//         return;
//       }

//       console.log("[Party] Party panel disappeared. Recreating...");

//       // The old React root belongs to the removed DOM node.
//       if (partyRoot) {
//         try {
//           partyRoot.unmount();
//         } catch (error) {
//           console.warn("[Party] Failed to unmount old Party root:", error);
//         }

//         partyRoot = null;
//       }

//       createPartyPanel();

//       const newPanel = document.getElementById("party-panel");

//       if (!newPanel) {
//         return;
//       }

//       newPanel.style.display = "block";

//       renderPartyScreen(newPanel);
//     });

//     partyPanelObserver.observe(document.body, {
//       childList: true,
//       subtree: true,
//     });

//     console.log("[Party] Party panel observer started.");
//   }

//   function renderPartyScreen(panel: HTMLElement) {
//     if (!partyRoot) {
//       partyRoot = Spicetify.ReactDOM.createRoot(panel);
//     }

//     if (currentScreen === "home") {
//       partyRoot.render(
//         <Home
//           onClose={closeParty}
//           onCreateParty={async () => {
//             try {
//               console.log("[Party] Creating party...");

//               const party = await createParty();

//               console.log("[Party] Created:", party);

//               const members = await getPartyMembers(party.party_id);

//               console.log("[Party] Members:", members);

//               partyId = party.party_id;
//               partyCode = party.party_code;
//               partyUserCount = members.length;

//               activeParty = {
//                 partyId: party.party_id,
//                 partyCode: party.party_code,
//               };

//               await updateHostQueueSync(party.party_id, members);

//               updatePartyButton();

//               currentScreen = "lobby";
//               renderPartyScreen(panel);
//             } catch (error) {
//               console.error("[Party] Failed to create party:", error);

//               Spicetify.showNotification("Party: Failed to create party");
//             }
//           }}
//           onJoinParty={() => {
//             currentScreen = "join-party";
//             renderPartyScreen(panel);
//           }}
//         />,
//       );

//       return;
//     }

//     if (currentScreen === "join-party") {
//       partyRoot.render(
//         <JoinParty
//           onBack={() => {
//             currentScreen = "home";
//             renderPartyScreen(panel);
//           }}
//           onJoinParty={async (code) => {
//             try {
//               console.log("[Party] Joining party:", code);

//               const party = await joinParty(code);

//               console.log("[Party] Joined:", party);

//               const members = await getPartyMembers(party.party_id);

//               console.log("[Party] Members:", members);

//               partyId = party.party_id;
//               partyCode = party.party_code;
//               partyUserCount = members.length;

//               activeParty = {
//                 partyId: party.party_id,
//                 partyCode: party.party_code,
//               };

//               await updateHostQueueSync(party.party_id, members);

//               updatePartyButton();

//               currentScreen = "lobby";

//               renderPartyScreen(panel);
//             } catch (error) {
//               console.error("[Party] Failed to join party:", error);

//               const message =
//                 error instanceof Error
//                   ? error.message
//                   : "Unable to join party.";

//               Spicetify.showNotification(`Party: ${message}`);

//               throw error;
//             }
//           }}
//         />,
//       );

//       return;
//     }

//     if (currentScreen === "lobby") {
//       partyRoot.render(
//         <Lobby
//           partyId={partyId}
//           partyCode={partyCode}
//           onBack={closeParty}
//           onEndParty={() => {
//             activeParty = null;
//             partyId = "";
//             partyCode = "";
//             partyUserCount = 0;

//             stopHostQueueSync();
//             updatePartyButton();
//             closeParty();
//           }}
//         />,
//       );
//     }
//   }

//   function createPartyPanel() {
//     const sidebar = getSidebar();

//     if (!sidebar) {
//       Spicetify.showNotification("Party: Right sidebar not found");

//       console.error("[Party] Desktop_PanelContainer_Id not found");

//       return;
//     }

//     if (document.getElementById("party-panel")) {
//       return;
//     }

//     const panel = document.createElement("div");

//     panel.id = "party-panel";

//     sidebar.appendChild(panel);

//     renderPartyScreen(panel);
//   }

//   function openParty() {
//     createPartyPanel();

//     const panel = document.getElementById("party-panel");

//     if (!panel) {
//       return;
//     }

//     /*
//      * If an active party exists, always recover directly
//      * into the existing lobby.
//      */
//     if (activeParty) {
//       partyId = activeParty.partyId;
//       partyCode = activeParty.partyCode;

//       currentScreen = "lobby";
//     } else {
//       currentScreen = "home";
//     }

//     renderPartyScreen(panel);

//     panel.style.display = "block";

//     partyOpen = true;

//     updatePartyButton();
//   }

//   function closeParty() {
//     const panel = document.getElementById("party-panel");

//     if (partyRoot) {
//       partyRoot.unmount();
//       partyRoot = null;
//     }

//     if (panel) {
//       panel.remove();
//     }

//     /*
//      * Do NOT destroy the active party state here.
//      *
//      * The user may simply be closing the sidebar.
//      * The Party button must still be able to recover
//      * the active Lobby.
//      */
//     partyOpen = false;

//     updatePartyButton();
//   }

//   function toggleParty() {
//     if (partyOpen) {
//       closeParty();
//       return;
//     }

//     openParty();
//   }

//   function createPartyButton() {
//     // Prevent duplicates
//     if (document.getElementById("spotify-party-button")) {
//       return;
//     }

//     const nowPlayingBar = document.querySelector(
//       '[data-testid="now-playing-bar"]',
//     );

//     if (!nowPlayingBar) {
//       console.error("[Party] Now Playing bar not found");

//       return;
//     }

//     const button = document.createElement("button");

//     button.id = "spotify-party-button";
//     button.type = "button";

//     button.setAttribute("aria-label", "Spotify Party");

//     button.innerHTML = `
//       <span class="party-button-left">#NA</span>
//       <span class="party-button-center">Party Mode</span>
//       <span class="party-button-right">
//         Users: 0
//       </span>
//     `;

//     button.addEventListener("click", () => {
//       toggleParty();
//     });

//     nowPlayingBar.appendChild(button);

//     partyButton = button;

//     updatePartyButton();
//   }

//   createPartyButton();
//   startPartyPanelObserver();

//   try {
//     const profile = await syncProfile();

//     console.log("[Party] Spotify profile synced:", {
//       accountId: profile.spotify_account_id,
//       displayName: profile.display_name,
//       avatarUrl: profile.avatar_url,
//     });
//   } catch (error) {
//     console.error("[Party] Failed to sync Spotify profile:", error);
//   }

//   await refreshActiveParty();

//   activePartyInterval = window.setInterval(() => {
//     void refreshActiveParty();
//   }, 15000);

//   console.log("[Party] Extension loaded");
// }

// export default main;

import React from "react";

import { syncProfile } from "./lib/profile";
import { getOrCreateSession } from "./lib/auth";
import { startHostQueueSync } from "./lib/queue";

// @ts-expect-error CSS imports are handled at build time.
import "./party.css";

import Home from "./screens/Home";
import JoinParty from "./screens/JoinParty";
import Lobby from "./screens/Lobby";

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

  /*
   * The Party panel used to be mounted directly inside Spotify's own
   * Desktop_PanelContainer_Id. Spotify reconciles that container's React
   * tree whenever playback state changes (e.g. Spicetify.Player.playUri()
   * on a member client), which wipes out our injected DOM node and takes
   * the Lobby down with it.
   *
   * To avoid that, the Party panel is now mounted into its own container
   * appended to document.body, completely outside Spotify's managed DOM,
   * and displayed as a fixed overlay positioned exactly over
   * Desktop_PanelContainer_Id. Spotify is free to rebuild the sidebar or
   * change tracks; it never touches our overlay, so partyRoot stays alive.
   */
  let partyOverlay: HTMLDivElement | null = null;
  let overlayPositionFrame: number | null = null;

  let hostQueueCleanup: (() => void) | null = null;
  let hostQueuePartyId: string | null = null;

  function stopHostQueueSync() {
    if (hostQueueCleanup) {
      hostQueueCleanup();
      hostQueueCleanup = null;
    }

    hostQueuePartyId = null;
  }

  async function updateHostQueueSync(
    targetPartyId: string | null,
    members: Awaited<ReturnType<typeof getPartyMembers>>,
  ) {
    if (!targetPartyId) {
      stopHostQueueSync();
      return;
    }

    const session = await getOrCreateSession();

    const currentMember = members.find(
      (member) => member.user_id === session.user.id,
    );

    const isHost = currentMember?.role === "host";

    if (!isHost) {
      stopHostQueueSync();
      return;
    }

    // Already syncing this party.
    if (hostQueuePartyId === targetPartyId && hostQueueCleanup) {
      return;
    }

    stopHostQueueSync();

    hostQueuePartyId = targetPartyId;
    hostQueueCleanup = startHostQueueSync(targetPartyId);

    console.log("[Party] Host queue sync started:", targetPartyId);
  }

  async function refreshActiveParty() {
    try {
      const party = await getActiveParty();

      if (!party) {
        activeParty = null;
        partyUserCount = 0;

        stopHostQueueSync();

        updatePartyButton();
        return;
      }

      activeParty = party;

      // Keep the local party state synchronized
      partyId = party.partyId;
      partyCode = party.partyCode;

      const members = await getPartyMembers(party.partyId);

      partyUserCount = members.length;

      await updateHostQueueSync(party.partyId, members);

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

  function positionPartyOverlay() {
    if (!partyOverlay) {
      return;
    }

    const sidebar = getSidebar();

    if (!sidebar) {
      // Sidebar is momentarily gone (e.g. mid re-render). Keep the
      // overlay at its last known position rather than snapping it away.
      return;
    }

    const rect = sidebar.getBoundingClientRect();

    partyOverlay.style.top = `${rect.top}px`;
    partyOverlay.style.left = `${rect.left}px`;
    partyOverlay.style.width = `${rect.width}px`;
    partyOverlay.style.height = `${rect.height}px`;
  }

  function startOverlayPositionTracking() {
    if (overlayPositionFrame !== null) {
      return;
    }

    const tick = () => {
      positionPartyOverlay();
      overlayPositionFrame = requestAnimationFrame(tick);
    };

    overlayPositionFrame = requestAnimationFrame(tick);
  }

  function stopOverlayPositionTracking() {
    if (overlayPositionFrame !== null) {
      cancelAnimationFrame(overlayPositionFrame);
      overlayPositionFrame = null;
    }
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

              await updateHostQueueSync(party.party_id, members);

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

              await updateHostQueueSync(party.party_id, members);

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

            stopHostQueueSync();
            updatePartyButton();
            closeParty();
          }}
        />,
      );
    }
  }

  function createPartyPanel() {
    if (document.getElementById("party-panel-overlay")) {
      return;
    }

    const sidebar = getSidebar();

    if (!sidebar) {
      Spicetify.showNotification("Party: Right sidebar not found");

      console.error("[Party] Desktop_PanelContainer_Id not found");

      return;
    }

    // Overlay container: lives on document.body, outside Spotify's
    // managed DOM, positioned to sit exactly on top of the sidebar.
    const overlay = document.createElement("div");

    overlay.id = "party-panel-overlay";

    overlay.style.position = "fixed";
    overlay.style.zIndex = "9999";
    overlay.style.boxSizing = "border-box";
    overlay.style.margin = "0";
    overlay.style.pointerEvents = "auto";

    document.body.appendChild(overlay);

    partyOverlay = overlay;

    const panel = document.createElement("div");

    panel.id = "party-panel";

    overlay.appendChild(panel);

    positionPartyOverlay();

    renderPartyScreen(panel);
  }

  function openParty() {
    createPartyPanel();

    const panel = document.getElementById("party-panel");

    if (!panel || !partyOverlay) {
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

    partyOverlay.style.display = "block";

    positionPartyOverlay();
    startOverlayPositionTracking();

    partyOpen = true;

    updatePartyButton();
  }

  function closeParty() {
    stopOverlayPositionTracking();

    if (partyRoot) {
      partyRoot.unmount();
      partyRoot = null;
    }

    if (partyOverlay) {
      partyOverlay.remove();
      partyOverlay = null;
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