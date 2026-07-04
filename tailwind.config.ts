import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Palet Kvolve "liquid amber glass" — dasar gelap bernuansa hangat,
        // dengan blob oren/amber/rust yang berbaur & bergerak ala air
        // (lihat LiquidBackdrop). Panel pakai glass.* — SEMUA transparan
        // (blur + saturasi) alih-alih solid, kesan kaca basah keseluruhan.
        canvas: "#120d0a",
        ink: "#f4ede6",
        accent: {
          DEFAULT: "#f97316",
          soft: "rgb(249 115 22 / 0.14)",
        },
        glass: {
          DEFAULT: "rgb(28 18 10 / 0.5)",
          soft: "rgb(255 255 255 / 0.05)",
          border: "rgb(255 210 160 / 0.14)",
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
        // Shadow berlapis khas panel melayang Kvolve (toolbar, palet, inspector
        // di dalam workspace kanvas — tetap gelap, lihat globals.css).
        float:
          "0 1px 2px rgb(0 0 0 / 0.4), 0 12px 32px -8px rgb(0 0 0 / 0.6)",
        // Glow aksen untuk CTA & elemen fokus — sentuhan "keren"-nya.
        glow: "0 0 24px -4px rgb(249 115 22 / 0.5), 0 0 48px -12px rgb(234 88 12 / 0.35)",
        // Elevasi kartu liquid-glass shell (dashboard/login/profil): dasar
        // gelap netral + glow oren lembut saat hover, di atas backdrop cair.
        card: "0 1px 2px rgb(0 0 0 / 0.3), 0 8px 24px -8px rgb(0 0 0 / 0.45)",
        "card-hover":
          "0 2px 4px rgb(0 0 0 / 0.3), 0 16px 40px -10px rgb(249 115 22 / 0.3)",
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
        // Gerak blob "liquid" — transform murni (translate+scale), murah di
        // GPU. Tiga durasi berbeda agar blob tak bergerak serempak (organik,
        // mensimulasikan efek warna berbaur di air).
        "float-a": {
          "0%, 100%": { transform: "translate(0, 0) scale(1)" },
          "50%": { transform: "translate(4%, -6%) scale(1.08)" },
        },
        "float-b": {
          "0%, 100%": { transform: "translate(0, 0) scale(1)" },
          "50%": { transform: "translate(-5%, 5%) scale(1.05)" },
        },
        "float-c": {
          "0%, 100%": { transform: "translate(0, 0) scale(1)" },
          "50%": { transform: "translate(3%, 4%) scale(1.1)" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.4s cubic-bezier(0.22, 1, 0.36, 1) both",
        "fade-in": "fade-in 0.3s ease both",
        "slide-in-right":
          "slide-in-right 0.35s cubic-bezier(0.22, 1, 0.36, 1) both",
        "pulse-soft": "pulse-soft 1.6s ease-in-out infinite",
        "float-a": "float-a 18s ease-in-out infinite",
        "float-b": "float-b 22s ease-in-out infinite",
        "float-c": "float-c 26s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;
