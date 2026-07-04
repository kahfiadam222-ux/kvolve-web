/**
 * Logo mark Kvolve — simbol ⌗ (bingkai kanvas tak terbatas) di atas kotak
 * bergradasi kaca biru (ocean blue → fresh mint), identitas Crystal OS.
 * Dipakai di nav, login, Studio Desain, dan layar loading kanvas.
 */
export function KvolveMark({ className = "h-8 w-8" }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden="true">
      <defs>
        <linearGradient id="kvmark-crystal" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#3B82F6" />
          <stop offset="100%" stopColor="#14B8A6" />
        </linearGradient>
      </defs>
      <rect width="32" height="32" rx="9" fill="url(#kvmark-crystal)" />
      <path
        d="M11.5 7v18M7 11.5h18M20.5 7v18M7 20.5h18"
        stroke="#ffffff"
        strokeWidth="2.2"
        strokeLinecap="round"
        opacity="0.95"
      />
    </svg>
  );
}
