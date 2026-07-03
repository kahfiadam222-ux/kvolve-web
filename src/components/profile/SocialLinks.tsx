import type { SocialLink } from "@/lib/profile/profileData";
import { PLATFORM_LABEL, SOCIAL_ICONS } from "./icons";

/**
 * Baris tautan media sosial eksternal (PRD 2). Setiap ikon membuka akun di
 * tab baru; rel noopener untuk keamanan. Tampil sebagai chip glass kecil.
 */
export function SocialLinks({ socials }: { socials: SocialLink[] }) {
  if (socials.length === 0) return null;

  return (
    <ul className="flex flex-wrap gap-2">
      {socials.map((s) => (
        <li key={s.platform}>
          <a
            href={s.url}
            target="_blank"
            rel="noopener noreferrer"
            title={`${PLATFORM_LABEL[s.platform]} · ${s.handle}`}
            className="inline-flex items-center gap-1.5 rounded-full border border-glass-border bg-glass-soft px-2.5 py-1 text-xs text-stone-300 transition-all hover:border-accent/40 hover:bg-white/[0.08] hover:text-accent"
          >
            <span className="shrink-0">{SOCIAL_ICONS[s.platform]}</span>
            <span className="max-w-28 truncate">{s.handle}</span>
          </a>
        </li>
      ))}
    </ul>
  );
}
