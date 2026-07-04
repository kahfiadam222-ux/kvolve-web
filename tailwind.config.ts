import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // ─── Kvovle Crystal OS — "Ice Glass" palette ───────────────────────
        // Background: clean ice white — workspace feels like frosted morning air.
        // Glass: real crystal translucency: rgba(255,255,255,0.45).
        // Accent: Ocean Blue — professional, calm, expensive.
        // Secondary: Fresh Mint — creative contrast, Apple-adjacent.
        // Text: Deep Navy on light — maximum legibility.

        canvas: "#F8FAFC",           // Ice White — main page background
        "canvas-soft": "#EFF4FB",    // Slightly deeper for section contrast

        ink: "#111827",              // Deep Navy — primary text
        "ink-muted": "#64748B",      // Slate — secondary/muted text
        "ink-subtle": "#94A3B8",     // Light slate — hints / placeholders

        accent: {
          DEFAULT: "#2563EB",        // Ocean Blue
          light: "#3B82F6",          // Lighter blue
          soft: "rgba(37,99,235,0.10)",   // Blue tint for hover/bg
          glow: "rgba(37,99,235,0.25)",   // Blue glow for shadows
        },

        mint: {
          DEFAULT: "#14B8A6",        // Fresh Mint
          soft: "rgba(20,184,166,0.12)",
          light: "#2DD4BF",
        },

        glass: {
          DEFAULT: "rgba(255,255,255,0.55)",   // Crystal glass panel
          soft: "rgba(255,255,255,0.35)",       // Lighter glass
          strong: "rgba(255,255,255,0.72)",     // Almost solid glass
          border: "rgba(255,255,255,0.70)",     // Visible glass border
          "border-subtle": "rgba(148,163,184,0.25)", // Subtle dividers
          "border-strong": "rgba(203,213,225,0.60)", // Stronger borders
        },

        // Crystal surface tints — for depth layering
        crystal: {
          blue: "rgba(219,234,254,0.50)",      // Soft blue glass
          mint: "rgba(204,251,241,0.50)",      // Soft mint glass
          white: "rgba(248,250,252,0.80)",     // Near-white glass
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

      boxShadow: {
        // ─── Crystal shadow system ─────────────────────────────────────────
        // Multi-layer shadows that simulate real glass depth & lighting.
        // Named by metaphor (float, card, glass) not by size (sm/md/lg).

        // Floating glass panels — toolbar, dock, modal
        float: [
          "0 1px 0 rgba(255,255,255,0.9) inset",    // top edge highlight
          "0 2px 4px rgba(0,0,0,0.04)",
          "0 8px 24px rgba(0,0,0,0.06)",
          "0 24px 48px rgba(0,0,0,0.08)",
        ].join(", "),

        // Cards — project cards, studio cards, template cards
        card: [
          "0 1px 0 rgba(255,255,255,0.9) inset",
          "0 1px 2px rgba(0,0,0,0.04)",
          "0 4px 16px rgba(0,0,0,0.06)",
        ].join(", "),

        // Hovered cards — lift effect
        "card-hover": [
          "0 1px 0 rgba(255,255,255,0.9) inset",
          "0 4px 8px rgba(0,0,0,0.06)",
          "0 12px 32px rgba(0,0,0,0.10)",
          "0 0 0 1px rgba(37,99,235,0.15)",
        ].join(", "),

        // Glass panels — sidebars, inspectors
        glass: [
          "0 1px 0 rgba(255,255,255,0.9) inset",
          "0 1px 2px rgba(0,0,0,0.03)",
          "0 8px 32px rgba(0,0,0,0.08)",
        ].join(", "),

        // Primary CTA glow
        glow: [
          "0 0 0 1px rgba(37,99,235,0.3)",
          "0 0 12px rgba(37,99,235,0.25)",
          "0 4px 16px rgba(37,99,235,0.20)",
        ].join(", "),

        // Mint accent glow
        "glow-mint": [
          "0 0 0 1px rgba(20,184,166,0.3)",
          "0 0 12px rgba(20,184,166,0.20)",
        ].join(", "),

        // Subtle inner glow for glass tops
        "inner-shine": "0 1px 0 rgba(255,255,255,0.95) inset",

        // Canvas editor dark panels
        "float-dark": [
          "0 1px 0 rgba(255,255,255,0.08) inset",
          "0 2px 4px rgba(0,0,0,0.4)",
          "0 12px 32px rgba(0,0,0,0.6)",
        ].join(", "),
      },

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

        // Ambient
        "float-a": "float-a 18s ease-in-out infinite",
        "float-b": "float-b 22s ease-in-out infinite",
        "float-c": "float-c 26s ease-in-out infinite",

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
