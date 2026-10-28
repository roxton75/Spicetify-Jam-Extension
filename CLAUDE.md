# Spicetify Jam Extension

## Project Overview
Spicetify Jam is a Spotify desktop client extension built with React, TypeScript, and Spicetify Creator. It enables users to create and join shared listening sessions ("Jam parties") directly inside Spotify, with real-time synchronization and queue management powered by Supabase.

## Tech Stack & Tools
- **Framework / Runtime:** React 19, TypeScript, Spicetify Creator (`spicetify-creator`)
- **Backend & State Sync:** Supabase (`@supabase/supabase-js`)
- **Icons:** `@phosphor-icons/react`, `lucide-react`
- **Styling:** CSS Modules / Custom global styles (`src/party.css`)

## Project Structure (`src/`)
- `app.tsx`: Main extension entry point; sets up standalone overlay containers over Spotify's sidebar/panels to prevent UI wipes during Spotify player reconciliation.
- `screens/`: UI views (`Home.tsx`, `JoinParty.tsx`, `Lobby.tsx`).
- `components/`: UI components (`PartyButton.tsx`, `PartyHeader.tsx`, `PartyIcon.tsx`, `MemberItem.tsx`, `PartyPlayback.tsx`, `PartyQueue.tsx`).
- `lib/`: Core logic modules:
  - `auth.ts`, `supabase.ts`, `profile.ts`: Authentication and Supabase client setup.
  - `party.ts`, `queue.ts`, `player.ts`, `playback.ts`: Party session handling, Spotify Player API wrappers, shared queue sync, and playback sync.
- `types/`: TypeScript definitions (`spicetify.d.ts`, `party.ts`, etc.).
- `utils/`: Utility functions (`generatePartyCode.ts`, etc.).

## Build & Development Commands
- `npm run build`: Build the production extension package using `spicetify-creator`.
- `npm run build-local`: Build local bundled output (`dist/`) minified.
- `npm run watch`: Run in watch mode for active development (`spicetify-creator --watch`).
- **Local Testing & Deployment Command:**
  ```powershell
  npm run build-local; Copy-Item ".\dist\jam.js" "$env:APPDATA\spicetify\Extensions\jam.js" -Force; spicetify apply
  ```
