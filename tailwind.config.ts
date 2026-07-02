import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Palet Kvolve (tema gelap redup) — charcoal hangat + kinetic teal.
        // Panel memakai glass.* (semi-transparan + backdrop-blur).
        canvas: "#161614",
        ink: "#e8e6e3",
        accent: {
          DEFAULT: "#2dd4bf",
          soft: "rgb(45 212 191 / 0.12)",
        },
        glass: {
          DEFAULT: "rgb(26 26 24 / 0.72)",
          soft: "rgb(255 255 255 / 0.06)",
          border: "rgb(255 255 255 / 0.10)",
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        mono: [
          "ui-monospace",
          "SFMono-Regular",
          "Cascadia Code",
          "Consolas",
          "monospace",
        ],
      },
      boxShadow: {
        // Shadow berlapis khas panel melayang Kvolve (toolbar, palet, inspector).
        float:
          "0 1px 2px rgb(0 0 0 / 0.35), 0 12px 32px -8px rgb(0 0 0 / 0.55)",
      },
      keyframes: {
        "fade-up": {
          from: { opacity: "0", transform: "translateY(10px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "fade-in": {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        "slide-in-right": {
          from: { opacity: "0", transform: "translateX(14px)" },
          to: { opacity: "1", transform: "translateX(0)" },
        },
        "pulse-soft": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.55" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.4s cubic-bezier(0.22, 1, 0.36, 1) both",
        "fade-in": "fade-in 0.3s ease both",
        "slide-in-right":
          "slide-in-right 0.35s cubic-bezier(0.22, 1, 0.36, 1) both",
        "pulse-soft": "pulse-soft 1.6s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;
