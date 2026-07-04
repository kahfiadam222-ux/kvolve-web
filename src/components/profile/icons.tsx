import type { JSX } from "react";
import type { SocialPlatform } from "@/lib/profile/profileData";

/**
 * Ikon platform sosial (monokrom currentColor) + warna gradasi khas tiap
 * platform untuk cincin story bubble, dan lencana Verified Creator.
 */

const wrap = (children: JSX.Element) => (
  <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden fill="currentColor">
    {children}
  </svg>
);

export const SOCIAL_ICONS: Record<SocialPlatform, JSX.Element> = {
  instagram: (
    <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden fill="none">
      <rect x="3.5" y="3.5" width="17" height="17" rx="5" stroke="currentColor" strokeWidth="1.7" />
      <circle cx="12" cy="12" r="3.8" stroke="currentColor" strokeWidth="1.7" />
      <circle cx="16.6" cy="7.4" r="1.1" fill="currentColor" />
    </svg>
  ),
  tiktok: wrap(
    <path d="M14 3c.3 2.4 1.9 4.2 4.3 4.5v2.6c-1.5.1-2.9-.3-4.3-1.1v5.7A5.7 5.7 0 1 1 8.3 9v2.8a3 3 0 1 0 3 3V3z" />,
  ),
  facebook: wrap(
    <path d="M13.5 21v-7h2.3l.4-2.8h-2.7V9.4c0-.8.3-1.4 1.5-1.4h1.3V5.5c-.6-.1-1.5-.2-2.5-.2-2.4 0-4 1.5-4 4.1V11H7.4v2.8h2.1V21z" />,
  ),
  reddit: wrap(
    <path d="M22 12.2a2 2 0 0 0-3.4-1.4 9.8 9.8 0 0 0-4.8-1.5l.9-3.9 2.8.6a1.5 1.5 0 1 0 .2-1.3l-3.4-.7-1.1 5a9.8 9.8 0 0 0-4.9 1.5A2 2 0 1 0 4 13.8a3.7 3.7 0 0 0 0 .7c0 2.9 3.6 5.3 8 5.3s8-2.4 8-5.3a3.7 3.7 0 0 0 0-.7 2 2 0 0 0 2-1.6zM8.5 13.5a1.3 1.3 0 1 1 1.3 1.3 1.3 1.3 0 0 1-1.3-1.3zm6.9 3.4a4.7 4.7 0 0 1-3.4 1 4.7 4.7 0 0 1-3.4-1 .5.5 0 0 1 .7-.7 3.8 3.8 0 0 0 2.7.7 3.8 3.8 0 0 0 2.7-.7.5.5 0 1 1 .7.7zm-.9-2.1a1.3 1.3 0 1 1 1.3-1.3 1.3 1.3 0 0 1-1.3 1.3z" />,
  ),
  github: wrap(
    <path d="M12 2a10 10 0 0 0-3.2 19.5c.5.1.7-.2.7-.5v-1.7c-2.8.6-3.4-1.3-3.4-1.3-.5-1.2-1.1-1.5-1.1-1.5-.9-.6.1-.6.1-.6 1 .1 1.5 1 1.5 1 .9 1.5 2.3 1.1 2.9.8.1-.7.4-1.1.6-1.4-2.2-.3-4.6-1.1-4.6-4.9 0-1.1.4-2 1-2.7-.1-.3-.4-1.3.1-2.6 0 0 .8-.3 2.7 1a9.3 9.3 0 0 1 5 0c1.9-1.3 2.7-1 2.7-1 .5 1.3.2 2.3.1 2.6.6.7 1 1.6 1 2.7 0 3.8-2.4 4.6-4.6 4.9.4.3.7.9.7 1.9v2.8c0 .3.2.6.7.5A10 10 0 0 0 12 2z" />,
  ),
  x: wrap(
    <path d="M17.5 3h3l-6.6 7.5L21.7 21h-6l-4.7-6-5.4 6H2.6l7-8L2.6 3h6.1l4.2 5.6zm-1 16h1.7L7.6 4.8H5.8z" />,
  ),
};

export const PLATFORM_LABEL: Record<SocialPlatform, string> = {
  instagram: "Instagram",
  tiktok: "TikTok",
  facebook: "Facebook",
  reddit: "Reddit",
  github: "GitHub",
  x: "X (Twitter)",
};

/** Lencana Verified Creator glossy (Ide Tambahan B) — biru Crystal. */
export function VerifiedBadge({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-label="Kreator terverifikasi" role="img">
      <defs>
        <linearGradient id="kv-verified" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#60A5FA" />
          <stop offset="1" stopColor="#2563EB" />
        </linearGradient>
      </defs>
      <path
        d="M12 1.8l2.3 1.7 2.9-.2 .9 2.7 2.4 1.6-.9 2.7.9 2.7-2.4 1.6-.9 2.7-2.9-.2L12 22.2l-2.3-1.7-2.9.2-.9-2.7-2.4-1.6.9-2.7-.9-2.7 2.4-1.6.9-2.7 2.9.2z"
        fill="url(#kv-verified)"
      />
      <path
        d="m8.5 12 2.3 2.3 4.7-4.7"
        fill="none"
        stroke="#ffffff"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
