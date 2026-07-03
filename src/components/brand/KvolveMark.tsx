/**
 * Logo mark Kvolve — simbol ⌗ (bingkai kanvas tak terbatas) di atas
 * kotak kinetic teal. Dipakai di nav, login, dan layar loading kanvas.
 */
export function KvolveMark({ className = "h-8 w-8" }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden="true">
      <rect width="32" height="32" rx="9" fill="#0d9488" />
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
