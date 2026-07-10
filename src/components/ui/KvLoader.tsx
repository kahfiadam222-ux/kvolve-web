/**
 * KvLoader — indikator loading kaca untuk respon yang tertunda.
 *
 * Dipakai oleh loading.tsx rute berat (editor kanvas memuat chunk PixiJS,
 * profil menghitung story TTL) dan bisa disematkan inline (`fullscreen=false`)
 * di panel mana pun. Murni presentasional tanpa hook — aman dirender sebagai
 * fallback Suspense server. Animasi transform-only + berhenti otomatis di
 * prefers-reduced-motion / mode Kurangi Gerakan (aturan global reduce-motion).
 */
export function KvLoader({
  label = "Memuat…",
  fullscreen = true,
  size = "md",
}: {
  label?: string;
  fullscreen?: boolean;
  /** "sm" untuk panel sempit (mis. papan Skor AI). */
  size?: "sm" | "md";
}) {
  const sm = size === "sm";
  const orb = (
    <div className={`flex flex-col items-center ${sm ? "gap-2" : "gap-4"}`}>
      <span
        className={`relative grid place-items-center ${sm ? "h-9 w-9" : "h-14 w-14"}`}
        aria-hidden
      >
        {/* Cincin conic berputar — identitas sama dengan orb AiOrb */}
        <span
          className="absolute inset-0 animate-spin rounded-full motion-reduce:animate-none"
          style={{
            background:
              "conic-gradient(from 0deg, rgb(var(--kv-accent)), rgb(var(--kv-mint)), transparent 55%, rgb(var(--kv-accent)))",
            WebkitMask:
              "radial-gradient(farthest-side, transparent calc(100% - 3px), #000 calc(100% - 3px))",
            mask: "radial-gradient(farthest-side, transparent calc(100% - 3px), #000 calc(100% - 3px))",
          }}
        />
        {/* Bola kristal di tengah */}
        <span
          className={`rounded-full ${sm ? "h-6 w-6" : "h-9 w-9"}`}
          style={{
            background:
              "linear-gradient(135deg, rgba(255,255,255,0.95), rgb(var(--kv-accent-wash) / 0.7) 40%, rgb(var(--kv-accent) / 0.45) 80%, rgb(var(--kv-mint) / 0.6))",
            boxShadow:
              "0 0 0 1px rgba(255,255,255,0.5) inset, 0 0 18px rgb(var(--kv-accent) / 0.25)",
          }}
        />
      </span>
      <p
        role="status"
        className={`animate-pulse-soft font-medium text-ink-muted ${sm ? "text-xs" : "text-sm"}`}
      >
        {label}
      </p>
    </div>
  );

  if (!fullscreen) return orb;

  return (
    <div className="grid min-h-dvh place-items-center bg-canvas text-ink">
      {orb}
    </div>
  );
}
