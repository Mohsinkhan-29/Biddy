import { fileURLToPath, URL } from "node:url";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { crx } from "@crxjs/vite-plugin";
// explicit .ts — a stale manifest.config.js sits next to it
import manifest from "./manifest.config.ts";

// CRXJS handles MV3 quirks (service worker HMR, content script injection,
// dynamic import support inside content scripts) that plain Vite can't.
export default defineConfig({
  plugins: [react(), crx({ manifest })],
  resolve: {
    // tsconfig.json's "paths" only affects the TypeScript type-checker/editor —
    // Vite's actual bundler needs these same aliases defined here too.
    alias: {
      "@shared": fileURLToPath(new URL("./src/shared", import.meta.url)),
      "@content": fileURLToPath(new URL("./src/content", import.meta.url)),
      "@background": fileURLToPath(new URL("./src/background", import.meta.url)),
      "@sidebar": fileURLToPath(new URL("./src/sidebar", import.meta.url)),
      "@styles": fileURLToPath(new URL("./src/styles", import.meta.url)),
    },
  },
  server: {
    // required so the content script can reach the Vite dev server for HMR
    port: 5173,
    strictPort: true,
    hmr: { port: 5173 },
  },
});