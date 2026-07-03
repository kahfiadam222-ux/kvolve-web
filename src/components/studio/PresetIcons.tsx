import type { JSX } from "react";
import type { PresetIconKey } from "@/lib/presets/canvasPresets";

/**
 * Ikon platform & kategori Studio Desain — goresan monokrom (currentColor)
 * agar serasi dengan tema glass gelap; warna mengikuti state hover/aktif.
 */

const S = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.6,
  strokeLinecap: "round",
  strokeLinejoin: "round",
} as const;

export const PRESET_ICONS: Record<PresetIconKey, JSX.Element> = {
  custom: (
    <svg width="18" height="18" viewBox="0 0 24 24" {...S} aria-hidden>
      <path d="M4 8h10M18 8h2M4 16h2M10 16h10" />
      <circle cx="16" cy="8" r="2.2" />
      <circle cx="8" cy="16" r="2.2" />
    </svg>
  ),
  instagram: (
    <svg width="18" height="18" viewBox="0 0 24 24" {...S} aria-hidden>
      <rect x="4" y="4" width="16" height="16" rx="4.5" />
      <circle cx="12" cy="12" r="3.6" />
      <circle cx="16.8" cy="7.2" r="0.6" fill="currentColor" stroke="none" />
    </svg>
  ),
  facebook: (
    <svg width="18" height="18" viewBox="0 0 24 24" {...S} aria-hidden>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M14.5 8.5h-1.7c-.9 0-1.5.6-1.5 1.6v1.4H9.8v2.4h1.5v6.1h2.5v-6.1h1.9l.4-2.4h-2.3V10.4c0-.4.2-.6.6-.6h1.6z" />
    </svg>
  ),
  youtube: (
    <svg width="18" height="18" viewBox="0 0 24 24" {...S} aria-hidden>
      <rect x="3" y="6" width="18" height="12" rx="3.5" />
      <path d="M10.2 9.6 15 12l-4.8 2.4z" fill="currentColor" stroke="none" />
    </svg>
  ),
  x: (
    <svg width="18" height="18" viewBox="0 0 24 24" {...S} aria-hidden>
      <path d="M5 4.5 18.6 19.5M18.8 4.5 5.2 19.5" />
    </svg>
  ),
  tiktok: (
    <svg width="18" height="18" viewBox="0 0 24 24" {...S} aria-hidden>
      <path d="M13.5 4v10.4a3.6 3.6 0 1 1-3.6-3.6" />
      <path d="M13.5 6.5c.7 2 2.4 3.4 4.7 3.6" />
    </svg>
  ),
  presentation: (
    <svg width="18" height="18" viewBox="0 0 24 24" {...S} aria-hidden>
      <rect x="3.5" y="4.5" width="17" height="11" rx="2" />
      <path d="M12 15.5v3M8.5 21l3.5-2.5 3.5 2.5" />
    </svg>
  ),
  catalog: (
    <svg width="18" height="18" viewBox="0 0 24 24" {...S} aria-hidden>
      <path d="M12 6c-1.8-1.3-4.2-1.6-7-1v13.5c2.8-.6 5.2-.3 7 1 1.8-1.3 4.2-1.6 7-1V5c-2.8-.6-5.2-.3-7 1z" />
      <path d="M12 6v13.5" />
    </svg>
  ),
  resume: (
    <svg width="18" height="18" viewBox="0 0 24 24" {...S} aria-hidden>
      <path d="M6 3.5h9L19 7.5v13H6z" />
      <path d="M14.5 3.5v4.5H19" />
      <circle cx="10.2" cy="11.5" r="1.6" />
      <path d="M8 16.5c.5-1.4 1.3-2 2.2-2s1.7.6 2.2 2M15.5 16.5h1" />
    </svg>
  ),
  namecard: (
    <svg width="18" height="18" viewBox="0 0 24 24" {...S} aria-hidden>
      <rect x="3" y="6.5" width="18" height="11" rx="2" />
      <circle cx="8.2" cy="11" r="1.5" />
      <path d="M6.2 14.8c.4-1.1 1.1-1.6 2-1.6s1.6.5 2 1.6M13.5 10.5H18M13.5 13.5h3" />
    </svg>
  ),
  poster: (
    <svg width="18" height="18" viewBox="0 0 24 24" {...S} aria-hidden>
      <rect x="5.5" y="3.5" width="13" height="17" rx="1.8" />
      <path d="m7.5 15.5 3-3.5 2.5 2.5 1.8-1.8 1.7 2.8" />
      <circle cx="10" cy="8.5" r="1.2" />
    </svg>
  ),
  brochure: (
    <svg width="18" height="18" viewBox="0 0 24 24" {...S} aria-hidden>
      <path d="M3.5 5.5 9 4.2v15l-5.5 1.3zM9 4.2l6 1.3v15l-6-1.5zM15 5.5l5.5-1.3v15L15 20.5z" />
    </svg>
  ),
  invitation: (
    <svg width="18" height="18" viewBox="0 0 24 24" {...S} aria-hidden>
      <rect x="3.5" y="6" width="17" height="12.5" rx="2" />
      <path d="m4.5 7.5 7.5 6 7.5-6" />
    </svg>
  ),
};
