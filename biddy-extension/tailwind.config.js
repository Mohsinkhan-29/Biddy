/** @type {import('tailwindcss').Config} */
export default {
  // Include every HTML/TS/TSX entry point — not just src/. Add or trim
  // paths below to match your actual popup/options/content-script layout.
  content: [
    "./index.html",
    "./popup.html",
    "./options.html",
    "./src/**/*.{ts,tsx,html}",
  ],
  // Biddy is injected into Upwork's own page via Shadow DOM, so Tailwind's
  // preflight (which resets html/body globally) must NOT leak onto Upwork's
  // page. We disable preflight globally and re-include a scoped reset only
  // inside the shadow root's own stylesheet (see styles/shadow-reset.css).
  corePlugins: { preflight: false },
  theme: {
    extend: {
      colors: {
        biddy: {
          bg: "#0F2E17",           // deep forest green — header/nav background
          bgDark: "#0A2010",       // darker shade for depth/borders on header
          accent: "#2FA92B",       // bright grass green — primary actions
          accentHover: "#278F24",
          surface: "#FFFFFF",      // white cards
          surfaceMuted: "#F4F5F4", // page background behind cards
          border: "#E4E7E4",
          text: "#1C2A20",         // near-black body text
          textMuted: "#5B6B60",    // secondary/description text
          muted: "#5B6B60",        // alias of textMuted — most components use this name
          danger: "#DC2626",
          warn: "#B45309",         // amber — was referenced by MetricRow but never defined,
                                    // so "warn" tone text rendered with no color at all
        },
      },
    },
  },
  plugins: [],
};