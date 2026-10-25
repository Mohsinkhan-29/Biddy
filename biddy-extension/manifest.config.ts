import "dotenv/config";
import { defineManifest } from "@crxjs/vite-plugin";
import pkg from "./package.json";

// chrome.identity.getAuthToken() (used for Google login) reads its client_id
// straight out of the manifest's oauth2 block — it does NOT take one at
// call-time — so this has to be baked in at build time from VITE_GOOGLE_CLIENT_ID.
const googleClientId = process.env.VITE_GOOGLE_CLIENT_ID ?? "";

// The extension may only call hosts listed in host_permissions, so the
// backend's origin comes from the same VITE_API_URL the code uses.
const apiOrigin = new URL(process.env.VITE_API_URL || "http://localhost:4000").origin;

export default defineManifest({
  manifest_version: 3,
  name: "Biddy — Upwork Job Intelligence",
  version: pkg.version,
  description: "Analyzes Upwork job pages and drafts AI proposals with Gemini.",
  icons: {
    16: "public/icons/icon16.jpg",
    48: "public/icons/icon48.jpg",
    128: "public/icons/icon128.jpg",
  },
  action: {
    default_popup: "src/popup/index.html",
  },
  background: {
    service_worker: "src/background/serviceWorker.ts",
    type: "module",
  },
  content_scripts: [
    {
      matches: ["https://www.upwork.com/*"],
      js: ["src/content/index.tsx"],
      run_at: "document_idle",
    },
  ],
  permissions: ["storage", "activeTab", "scripting", "identity"],
  host_permissions: [
    "https://www.upwork.com/*",
    `${apiOrigin}/*`,
  ],
  oauth2: {
    client_id: googleClientId,
    scopes: [
      "https://www.googleapis.com/auth/userinfo.email",
      "https://www.googleapis.com/auth/userinfo.profile",
    ],
  },
});
