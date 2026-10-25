import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        paper: "#F4F6FA",
        ink: "#14213D",
        slate: "#5A6A80",
        line: "#DCE2EC",
        leaf: { DEFAULT: "#1E8E4E", dark: "#166B3B", soft: "#E3F3EA" },
        amber: { DEFAULT: "#D9930D", soft: "#FBF0DA" },
        flag: { DEFAULT: "#C0392B", soft: "#F8E3E0" },
      },
      fontFamily: {
        display: ['"Bricolage Grotesque Variable"', "system-ui", "sans-serif"],
        body: ['"Source Sans 3 Variable"', "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
export default config;
