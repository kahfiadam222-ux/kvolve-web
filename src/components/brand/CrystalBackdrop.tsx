/**
 * CrystalBackdrop — Kvovle ambient environment ("Background World").
 *
 * Blob atmosfer + base + noise sepenuhnya var-driven (--kv-blob-*,
 * --kv-canvas, --kv-noise-a) sehingga tema mengendalikan seluruh suasana
 * latar. Default = "clean morning workspace" Crystal (nilai persis era
 * hardcoded, lihat :root globals.css).
 *
 * Transform-only animation (translate+scale) is GPU-composited; no paint.
 * Kelas `kv-backdrop`/`kv-blob` adalah kait comfort-mode (fokus/performa).
 */
export function CrystalBackdrop() {
  return (
    <div
      aria-hidden
      className="kv-backdrop pointer-events-none fixed inset-0 -z-10 overflow-hidden"
      style={{ background: "rgb(var(--kv-canvas))" }}
    >
      {/* Primary ambient — top-left */}
      <span
        className="kv-blob animate-float-a absolute -left-40 -top-40 rounded-full"
        style={{
          width: "42rem",
          height: "42rem",
          background: "radial-gradient(circle, var(--kv-blob-1a), var(--kv-blob-1b) 50%, transparent 75%)",
          filter: "blur(80px)",
        }}
      />

      {/* Secondary — top-right */}
      <span
        className="kv-blob animate-float-b absolute -right-48 -top-28 rounded-full"
        style={{
          width: "48rem",
          height: "48rem",
          background: "radial-gradient(circle, var(--kv-blob-2a), var(--kv-blob-2b) 50%, transparent 72%)",
          filter: "blur(100px)",
        }}
      />

      {/* Center accent */}
      <span
        className="kv-blob animate-float-c absolute left-1/2 top-1/3 -translate-x-1/2 rounded-full"
        style={{
          width: "36rem",
          height: "36rem",
          background: "radial-gradient(circle, var(--kv-blob-3a), var(--kv-blob-3b) 50%, transparent 70%)",
          filter: "blur(90px)",
        }}
      />

      {/* Bottom — depth */}
      <span
        className="kv-blob animate-float-a absolute -bottom-48 -right-32 rounded-full"
        style={{
          width: "40rem",
          height: "40rem",
          background: "radial-gradient(circle, var(--kv-blob-4a), var(--kv-blob-4b) 50%, transparent 75%)",
          filter: "blur(100px)",
        }}
      />

      {/* Bottom-left — neutral anchor glow */}
      <span
        className="kv-blob animate-float-b absolute -bottom-28 -left-20 rounded-full"
        style={{
          width: "30rem",
          height: "30rem",
          background: "radial-gradient(circle, var(--kv-blob-5a), transparent 70%)",
          filter: "blur(80px)",
        }}
      />

      {/* Noise texture overlay for premium tactility */}
      <div
        className="absolute inset-0"
        style={{
          opacity: "calc(var(--kv-noise-a) * var(--kv-perf-noise))",
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='1'/%3E%3C/svg%3E")`,
          backgroundRepeat: "repeat",
          backgroundSize: "128px 128px",
        }}
      />
    </div>
  );
}
