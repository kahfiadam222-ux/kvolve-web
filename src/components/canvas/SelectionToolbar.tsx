"use client";

import { useMemo } from "react";
import { useCanvasStore } from "@/stores/canvasStore";
import { deleteSelected, duplicateSelected } from "@/lib/canvas/objectActions";

/**
 * SelectionToolbar — aksi cepat untuk objek terpilih (Duplikat & Hapus),
 * membuat manajemen objek dapat ditemukan lewat mouse selain pintasan
 * keyboard (Del/Backspace, Ctrl/Cmd+D) di engine.
 *
 * Overlay DOM yang diproyeksikan dari bounding box seleksi (world space)
 * ke layar memakai kamera dari store — menempel pada objek saat pan/zoom.
 * Ditempatkan di atas kotak; bila mepet tepi atas, dipindah ke bawah kotak.
 */
export function SelectionToolbar() {
  const objects = useCanvasStore((s) => s.objects);
  const selectedIds = useCanvasStore((s) => s.selectedIds);
  const camera = useCanvasStore((s) => s.camera);

  /** Bounding box gabungan objek terpilih (world space). */
  const bbox = useMemo(() => {
    let minX = Infinity,
      minY = Infinity,
      maxX = -Infinity,
      maxY = -Infinity;
    let count = 0;
    for (const id of selectedIds) {
      const o = objects.get(id);
      if (!o) continue;
      count++;
      minX = Math.min(minX, o.x);
      minY = Math.min(minY, o.y);
      maxX = Math.max(maxX, o.x + o.width);
      maxY = Math.max(maxY, o.y + o.height);
    }
    return count > 0 ? { minX, minY, maxX, maxY, count } : null;
  }, [selectedIds, objects]);

  if (!bbox) return null;

  const s = camera.scale;
  const centerX = ((bbox.minX + bbox.maxX) / 2) * s + camera.x;
  const topY = bbox.minY * s + camera.y;
  const bottomY = bbox.maxY * s + camera.y;
  // Default di atas kotak; bila terlalu dekat tepi atas, taruh di bawah.
  const above = topY > 52;
  const y = above ? topY - 44 : bottomY + 12;

  return (
    <div
      className="pointer-events-auto absolute z-10 flex -translate-x-1/2 animate-fade-in items-center gap-0.5 rounded-full border border-glass-border bg-glass px-1.5 py-1 shadow-float backdrop-blur-md"
      style={{ left: `${centerX}px`, top: `${y}px` }}
    >
      {bbox.count > 1 && (
        <span className="px-2 text-[11px] font-medium text-stone-400">
          {bbox.count} objek
        </span>
      )}
      <button
        type="button"
        title="Duplikat (Ctrl/Cmd + D)"
        aria-label="Duplikat objek terpilih"
        onClick={() => duplicateSelected()}
        className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium text-stone-300 transition-colors hover:bg-white/10 hover:text-ink"
      >
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" aria-hidden>
          <rect x="8" y="8" width="12" height="12" rx="2" stroke="currentColor" strokeWidth="1.7" />
          <path d="M4 16V5a1 1 0 0 1 1-1h11" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
        </svg>
        Duplikat
      </button>
      <span className="mx-0.5 h-4 w-px bg-white/10" aria-hidden />
      <button
        type="button"
        title="Hapus (Del)"
        aria-label="Hapus objek terpilih"
        onClick={() => deleteSelected()}
        className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium text-rose-300 transition-colors hover:bg-rose-500/15"
      >
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" aria-hidden>
          <path
            d="M4 7h16M9 7V5h6v2m-8.5 0 .8 12h9.4l.8-12"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        Hapus
      </button>
    </div>
  );
}
