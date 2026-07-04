/**
 * CrystalBackdrop — Kvovle Crystal OS ambient environment.
 *
 * Soft, barely-tinted blobs on an ice-white base. The feeling:
 * "clean morning workspace" — sunlight filtering through frosted glass.
 *
 * Color palette: pale blue, soft teal, light periwinkle — no aurora neons,
 * no orange, no purple. Very large blurs (120–160px) keep blobs invisible
 * as distinct shapes; they register only as ambient color atmosphere.
 *
 * Transform-only animation (translate+scale) is GPU-composited; no paint.
 */
export function CrystalBackdrop() {
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
      style={{ background: "#F8FAFC" }}
    >
      {/* Primary ambient — top-left: soft sky blue */}
      <span
        className="animate-float-a absolute -left-40 -top-40 rounded-full"
        style={{
          width: "42rem",
          height: "42rem",
          background: "radial-gradient(circle, rgba(186,230,253,0.55), rgba(147,197,253,0.30) 50%, transparent 75%)",
          filter: "blur(80px)",
        }}
      />

      {/* Secondary — top-right: soft periwinkle */}
      <span
        className="animate-float-b absolute -right-48 -top-28 rounded-full"
        style={{
          width: "48rem",
          height: "48rem",
          background: "radial-gradient(circle, rgba(196,181,253,0.30), rgba(167,139,250,0.15) 50%, transparent 72%)",
          filter: "blur(100px)",
        }}
      />

      {/* Center accent — fresh mint tint */}
      <span
        className="animate-float-c absolute left-1/2 top-1/3 -translate-x-1/2 rounded-full"
        style={{
          width: "36rem",
          height: "36rem",
          background: "radial-gradient(circle, rgba(153,246,228,0.30), rgba(94,234,212,0.15) 50%, transparent 70%)",
          filter: "blur(90px)",
        }}
      />

      {/* Bottom — soft blue-gray depth */}
      <span
        className="animate-float-a absolute -bottom-48 -right-32 rounded-full"
        style={{
          width: "40rem",
          height: "40rem",
          background: "radial-gradient(circle, rgba(186,230,253,0.35), rgba(147,197,253,0.18) 50%, transparent 75%)",
          filter: "blur(100px)",
        }}
      />

      {/* Bottom-left — warm white glow (neutral anchor) */}
      <span
        className="animate-float-b absolute -bottom-28 -left-20 rounded-full"
        style={{
          width: "30rem",
          height: "30rem",
          background: "radial-gradient(circle, rgba(224,242,254,0.50), transparent 70%)",
          filter: "blur(80px)",
        }}
      />

      {/* Noise texture overlay for premium tactility */}
      <div
        className="absolute inset-0 opacity-[0.018]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='1'/%3E%3C/svg%3E")`,
          backgroundRepeat: "repeat",
          backgroundSize: "128px 128px",
        }}
      />
    </div>
  );
}
