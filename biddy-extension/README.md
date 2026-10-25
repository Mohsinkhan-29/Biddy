# Biddy Extension (React + Tailwind + Vite/CRXJS)

## Setup

```bash
cp .env.example .env
# set VITE_API_URL (defaults fine for local dev) and VITE_GOOGLE_CLIENT_ID
# (see biddy-backend/README.md for how to create the Google OAuth client —
# you need this extension's ID first, see step 1 below, so there's a
# chicken-and-egg first run: load unpacked once with a blank client_id,
# copy the ID Chrome assigns, create the OAuth client, then rebuild)

npm install
npm run dev      # loads an unpacked dev build with HMR
```

Then in Chrome: `chrome://extensions` → enable Developer mode → **Load unpacked** → select the `dist/` folder Vite generates.

## Before this works against a real Upwork page

1. Open a real Upwork search results page, inspect the DOM, and fill in the real selectors in `src/content/domSelectors.ts` — the ones in this scaffold are placeholders.
2. Update `manifest.config.ts`'s `host_permissions` and `vite.config.ts` if your backend isn't on `localhost:4000`.
3. Point `backendUrl` in the Config tab at your running `biddy-backend` instance.
4. Set `VITE_GOOGLE_CLIENT_ID` in `.env` (see backend README) and rebuild — without it, Google sign-in fails immediately.

## Auth

The extension is gated behind login (`sidebar/components/ProtectedRoute.tsx`) — no tab, no backend call, no AI feature is reachable until a session exists.

- **Login**: `chrome.identity.getAuthToken()` gets a Google access token scoped to this extension (via the `oauth2.client_id` baked into the manifest at build time), which is POSTed to the backend's `/api/auth/google`. The returned JWT access/refresh tokens and user profile are stored in `chrome.storage.local` (`src/shared/utils/authStorage.ts`).
- **Authenticated calls**: `src/background/api/httpClient.ts`'s `authedFetch` attaches the access token to every backend call, and on a `401` refreshes once via `/api/auth/refresh` and retries the original request automatically.
- **Logout**: revokes the refresh token server-side, drops the cached Google token, and clears local storage.

## Structure

- `src/content/` — scrapes Upwork's DOM, injects the React Intelligence Sheet via Shadow DOM
- `src/background/` — service worker: message routing, auth, calls to your Node backend, local caching
- `src/sidebar/` — Dashboard / Proposal Engine / Config tabs, plus `components/` for login/session UI
- `src/popup/` — toolbar icon quick-access panel (renders `sidebar/App`)
- `src/shared/` — types and utilities used by more than one layer (this is the file every other layer should import from, not each other, to keep the dependency graph flat)

See `../biddy-architecture.md` for the full data-flow write-up.
