import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Palet Kvolve v2 "deep space" — indigo-hitam dingin + aksen aurora
        // (kinetic teal → violet → fuchsia). Panel memakai glass.*
        // (semi-transparan + backdrop-blur) di atas glow aurora statis.
        canvas: "#0d0d15",
        ink: "#e9e8f2",
        accent: {
          DEFAULT: "#2dd4bf",
          soft: "rgb(45 212 191 / 0.12)",
        },
        glass: {
          DEFAULT: "rgb(19 19 30 / 0.72)",
          soft: "rgb(255 255 255 / 0.05)",
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
          "0 1px 2px rgb(0 0 0 / 0.4), 0 12px 32px -8px rgb(0 0 0 / 0.6)",
        // Glow aksen untuk CTA & elemen fokus — sentuhan "keren"-nya.
        glow: "0 0 24px -4px rgb(45 212 191 / 0.45), 0 0 48px -12px rgb(167 139 250 / 0.35)",
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
