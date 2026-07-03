"use client";

import { useCanvasStore } from "@/stores/canvasStore";

/**
 * MultiplayerCursors (W-FR-2.2) — kursor peserta lain dirender sebagai
 * overlay DOM (bukan objek Pixi) karena label nama + transisi CSS jauh
 * lebih murah di DOM, dan jumlah kursor selalu kecil.
 *
 * Posisi kursor tersimpan dalam WORLD SPACE (agar tetap menempel pada
 * konten saat masing-masing pengguna punya zoom berbeda), lalu
 * diproyeksikan ke layar dengan kamera lokal dari store.
 */
export function MultiplayerCursors() {
  const cursors = useCanvasStore((s) => s.remoteCursors);
  const camera = useCanvasStore((s) => s.camera);

  if (cursors.length === 0) return null;

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {cursors.map((c) => {
        const x = c.x * camera.scale + camera.x;
        const y = c.y * camera.scale + camera.y;
        return (
          <div
            key={c.clientId}
            className="absolute left-0 top-0 animate-fade-in transition-transform duration-75 ease-linear will-change-transform"
            style={{ transform: `translate(${x}px, ${y}px)` }}
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill={c.color}
              style={{ filter: "drop-shadow(0 1px 2px rgb(0 0 0 / 0.25))" }}
            >
              <path d="M5.5 3.2 19 11.4l-6.3 1.3-3.5 5.5z" />
            </svg>
            <span
              className="ml-3 inline-block max-w-40 truncate rounded-full px-2 py-0.5 text-[11px] font-medium text-white shadow-sm ring-1 ring-white/40"
              style={{ backgroundColor: c.color }}
            >
              {c.name}
            </span>
          </div>
        );
      })}
    </div>
  );
}
