import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  future: {
    // Semua varian hover: hanya aktif di perangkat yang benar-benar punya
    // hover (@media (hover:hover)) — mencegah sticky-hover di layar sentuh.
    // Konsekuensi: state yang DIBUTUHKAN di touch tidak boleh hover-only;
    // beri fallback statis/active: (lihat StudioCards/ProjectGallery).
    hoverOnlyWhenSupported: true,
  },
  theme: {
    extend: {
      colors: {
        // ─── Liquid Intelligence — token layer berbasis CSS variables ──────
        // Nilai sesungguhnya hidup di :root globals.css (default = Crystal
        // "Ice Glass") dan bisa ditimpa runtime oleh ThemeProvider
        // (src/lib/themes). Triplet RGB spasi agar slash-opacity Tailwind
        // (mis. bg-canvas/60, border-accent/30) tetap terkomposisi.

        canvas: "rgb(var(--kv-canvas) / <alpha-value>)",
        "canvas-soft": "rgb(var(--kv-canvas-soft) / <alpha-value>)",

        ink: "rgb(var(--kv-ink) / <alpha-value>)",
        "ink-muted": "rgb(var(--kv-ink-muted) / <alpha-value>)",
        "ink-subtle": "rgb(var(--kv-ink-subtle) / <alpha-value>)",
        "ink-strong": "rgb(var(--kv-ink-strong) / <alpha-value>)",

        /** Warna teks di atas gradient CTA (tema gelap-emas memakai gelap). */
        "cta-ink": "rgb(var(--kv-cta-ink) / <alpha-value>)",

        accent: {
          DEFAULT: "rgb(var(--kv-accent) / <alpha-value>)",
          light: "rgb(var(--kv-accent-light) / <alpha-value>)",
          soft: "rgb(var(--kv-accent) / 0.10)",
          glow: "rgb(var(--kv-accent) / 0.25)",
        },

        mint: {
          DEFAULT: "rgb(var(--kv-mint) / <alpha-value>)",
          soft: "rgb(var(--kv-mint) / 0.12)",
          light: "rgb(var(--kv-mint-light) / <alpha-value>)",
        },

        glass: {
          DEFAULT: "rgb(var(--kv-glass-rgb) / var(--kv-glass-a))",
          soft: "rgb(var(--kv-glass-rgb) / var(--kv-glass-soft-a))",
          strong: "rgb(var(--kv-glass-rgb) / var(--kv-glass-strong-a))",
          border: "rgb(var(--kv-glass-border-rgb) / var(--kv-glass-border-a))",
          "border-subtle": "rgb(var(--kv-ink-subtle) / 0.25)",
          "border-strong": "rgb(var(--kv-glass-border-strong-rgb) / 0.60)",
        },

        // Crystal surface tints — for depth layering
        crystal: {
          blue: "rgb(var(--kv-accent-wash) / 0.50)",
          mint: "rgb(var(--kv-mint-wash) / 0.50)",
          white: "rgb(var(--kv-canvas) / 0.80)",
        },
      },

      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        display: ["var(--font-display)", "var(--font-sans)", "system-ui", "sans-serif"],
        mono: [
          "ui-monospace",
          "SFMono-Regular",
          "Cascadia Code",
          "Consolas",
          "monospace",
        ],
      },

      // ─── Skala display fluid ───────────────────────────────────────────
      // clamp() = mengecil mulus di ponsel tanpa breakpoint per-halaman;
      // tracking negatif dikalibrasi untuk Plus Jakarta Sans ukuran besar.
      // Pakai bersama `font-display` (mis. "font-display text-display-xl").
      fontSize: {
        "display-2xl": [
          "clamp(2.25rem, 1.4rem + 3.6vw, 3.75rem)",
          { lineHeight: "1.04", letterSpacing: "-0.035em", fontWeight: "700" },
        ],
        "display-xl": [
          "clamp(1.9rem, 1.35rem + 2.4vw, 3rem)",
          { lineHeight: "1.08", letterSpacing: "-0.03em", fontWeight: "700" },
        ],
        "display-lg": [
          "clamp(1.55rem, 1.3rem + 1.2vw, 2.25rem)",
          { lineHeight: "1.12", letterSpacing: "-0.025em", fontWeight: "600" },
        ],
        "display-md": [
          "clamp(1.3rem, 1.15rem + 0.7vw, 1.65rem)",
          { lineHeight: "1.18", letterSpacing: "-0.02em", fontWeight: "600" },
        ],
        "display-sm": [
          "clamp(1.125rem, 1.05rem + 0.4vw, 1.35rem)",
          { lineHeight: "1.25", letterSpacing: "-0.015em", fontWeight: "600" },
        ],
      },

      boxShadow: {
        // ─── Crystal shadow system ─────────────────────────────────────────
        // Multi-layer shadows that simulate real glass depth & lighting.
        // Named by metaphor (float, card, glass) not by size (sm/md/lg).
        // Rim-light putih memakai --kv-inset-a agar tema gelap bisa
        // meredupkannya (pola sama dengan float-dark).

        // Floating glass panels — toolbar, dock, modal
        float: [
          "0 1px 0 rgba(255,255,255,var(--kv-inset-a)) inset",
          "0 2px 4px rgba(0,0,0,0.04)",
          "0 8px 24px rgba(0,0,0,0.06)",
          "0 24px 48px rgba(0,0,0,0.08)",
        ].join(", "),

        // Cards — project cards, studio cards, template cards
        card: [
          "0 1px 0 rgba(255,255,255,var(--kv-inset-a)) inset",
          "0 1px 2px rgba(0,0,0,0.04)",
          "0 4px 16px rgba(0,0,0,0.06)",
        ].join(", "),

        // Hovered cards — lift effect
        "card-hover": [
          "0 1px 0 rgba(255,255,255,var(--kv-inset-a)) inset",
          "0 4px 8px rgba(0,0,0,0.06)",
          "0 12px 32px rgba(0,0,0,0.10)",
          "0 0 0 1px rgb(var(--kv-accent) / 0.15)",
        ].join(", "),

        // Glass panels — sidebars, inspectors
        glass: [
          "0 1px 0 rgba(255,255,255,var(--kv-inset-a)) inset",
          "0 1px 2px rgba(0,0,0,0.03)",
          "0 8px 32px rgba(0,0,0,0.08)",
        ].join(", "),

        // Primary CTA glow
        glow: [
          "0 0 0 1px rgb(var(--kv-accent) / 0.3)",
          "0 0 12px rgb(var(--kv-accent) / 0.25)",
          "0 4px 16px rgb(var(--kv-accent) / 0.20)",
        ].join(", "),

        // Stronger CTA hover glow (menggantikan literal shadow-[0_0_20px_...])
        "glow-strong": "0 0 20px rgb(var(--kv-accent) / 0.4)",

        // Mint accent glow
        "glow-mint": [
          "0 0 0 1px rgb(var(--kv-mint) / 0.3)",
          "0 0 12px rgb(var(--kv-mint) / 0.20)",
        ].join(", "),

        // Subtle inner glow for glass tops
        "inner-shine": "0 1px 0 rgba(255,255,255,var(--kv-inset-a)) inset",

        // Canvas editor dark panels (identitas editor — tidak ikut tema)
        "float-dark": [
          "0 1px 0 rgba(255,255,255,0.08) inset",
          "0 2px 4px rgba(0,0,0,0.4)",
          "0 12px 32px rgba(0,0,0,0.6)",
        ].join(", "),
      },

      // SENGAJA statis: Tailwind menyalurkan nilai ini lewat rantai custom
      // property --tw-backdrop-blur, dan calc()+var() di rantai itu terbukti
      // tidak ter-evaluasi di Chrome (nilai langsung seperti .crystal-panel
      // di globals.css aman). Mode Performa memangkas blur utilitas ini via
      // aturan !important di globals.css, bukan lewat var.
      backdropBlur: {
        xs: "4px",
        sm: "8px",
        md: "16px",
        lg: "30px",
        xl: "48px",
        "2xl": "64px",
      },

      keyframes: {
        // ─── Enter / Exit ─────────────────────────────────────────────────
        "fade-up": {
          from: { opacity: "0", transform: "translateY(12px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "fade-in": {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        "fade-down": {
          from: { opacity: "0", transform: "translateY(-8px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "zoom-in": {
          from: { opacity: "0", transform: "scale(0.96)" },
          to: { opacity: "1", transform: "scale(1)" },
        },
        "slide-in-right": {
          from: { opacity: "0", transform: "translateX(16px)" },
          to: { opacity: "1", transform: "translateX(0)" },
        },
        "slide-in-left": {
          from: { opacity: "0", transform: "translateX(-16px)" },
          to: { opacity: "1", transform: "translateX(0)" },
        },

        // ─── Ambient motion ───────────────────────────────────────────────
        "float-a": {
          "0%, 100%": { transform: "translate(0, 0) scale(1)" },
          "50%": { transform: "translate(4%, -6%) scale(1.06)" },
        },
        "float-b": {
          "0%, 100%": { transform: "translate(0, 0) scale(1)" },
          "50%": { transform: "translate(-5%, 5%) scale(1.04)" },
        },
        "float-c": {
          "0%, 100%": { transform: "translate(0, 0) scale(1)" },
          "50%": { transform: "translate(3%, 4%) scale(1.08)" },
        },

        // ─── Micro interactions ───────────────────────────────────────────
        "pulse-soft": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.5" },
        },
        // AI orb breathing glow
        breathe: {
          "0%, 100%": { transform: "scale(1)", opacity: "0.8" },
          "50%": { transform: "scale(1.08)", opacity: "1" },
        },
        // Gentle card float
        "hover-float": {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-3px)" },
        },
        // Shimmer loading
        shimmer: {
          from: { backgroundPosition: "200% 0" },
          to: { backgroundPosition: "-200% 0" },
        },
        // Liquid press
        "liquid-press": {
          "0%": { transform: "scale(1)" },
          "50%": { transform: "scale(0.97)" },
          "100%": { transform: "scale(1)" },
        },
        // Glass reflection sweep
        "glass-sweep": {
          from: { transform: "translateX(-100%)" },
          to: { transform: "translateX(200%)" },
        },
        // Dock expand
        "dock-expand": {
          from: { width: "3rem", opacity: "0.7" },
          to: { width: "10rem", opacity: "1" },
        },
      },

      animation: {
        // Enter animations
        "fade-up": "fade-up 0.4s cubic-bezier(0.22, 1, 0.36, 1) both",
        "fade-in": "fade-in 0.3s ease both",
        "fade-down": "fade-down 0.3s cubic-bezier(0.22, 1, 0.36, 1) both",
        "zoom-in": "zoom-in 0.35s cubic-bezier(0.22, 1, 0.36, 1) both",
        "slide-in-right": "slide-in-right 0.35s cubic-bezier(0.22, 1, 0.36, 1) both",
        "slide-in-left": "slide-in-left 0.35s cubic-bezier(0.22, 1, 0.36, 1) both",

        // Ambient — durasi mengikuti --kv-motion-scale per tema
        "float-a": "float-a calc(18s * var(--kv-motion-scale)) ease-in-out infinite",
        "float-b": "float-b calc(22s * var(--kv-motion-scale)) ease-in-out infinite",
        "float-c": "float-c calc(26s * var(--kv-motion-scale)) ease-in-out infinite",

        // Micro
        "pulse-soft": "pulse-soft 1.8s ease-in-out infinite",
        breathe: "breathe 3s ease-in-out infinite",
        shimmer: "shimmer 2s ease-in-out infinite",
        "hover-float": "hover-float 3s ease-in-out infinite",
        "glass-sweep": "glass-sweep 0.8s ease both",
        "liquid-press": "liquid-press 0.25s cubic-bezier(0.22, 1, 0.36, 1)",
        "dock-expand": "dock-expand 0.2s cubic-bezier(0.22, 1, 0.36, 1) both",
      },
    },
  },
  plugins: [],
};

export default config;
