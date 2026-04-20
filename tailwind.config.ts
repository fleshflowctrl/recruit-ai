import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        sidebar: "#2C2B28",
        primary: "#1A1A18",
        accent: "#5C6B3A",
        success: "#1A5C2A",
        warning: "#7A5C10",
        danger: "#8B2020",
        muted: "#8A8A85",
        faint: "#B0AFA9",
        border: "rgba(0,0,0,0.08)",
        cream: {
          bg: "#FAFAF8",
          surface: "#F5F4F0",
          raised: "#EFEDE8",
        },
      },
      fontFamily: {
        serif: ["var(--font-instrument-serif)", "Georgia", "serif"],
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
        mono: ["var(--font-jetbrains-mono)", "ui-monospace", "monospace"],
      },
    },
  },
  plugins: [],
};

export default config;
