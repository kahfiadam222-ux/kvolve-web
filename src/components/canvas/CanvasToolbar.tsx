"use client";

import type { RefObject } from "react";
import type { CanvasEngine } from "@/lib/engine/CanvasEngine";
import { exportSiteZip } from "@/lib/export/exportZip";
import { useCanvasStore } from "@/stores/canvasStore";

/**
 * Kontrol kamera memanggil API engine (bukan menulis store langsung) —
 * engine adalah satu-satunya penulis transformasi world, store hanya cermin.
 * Persentase zoom dibaca reaktif dari store.
 */
export function CanvasToolbar({
  engineRef,
  onOpenStudio,
}: {
  engineRef: RefObject<CanvasEngine | null>;
  onOpenStudio: () => void;
}) {
  const scale = useCanvasStore((s) => s.camera.scale);
  const artboard = useCanvasStore((s) => s.artboard);
  const hasBlocks = useCanvasStore((s) => {
    for (const o of s.objects.values()) if (o.type === "html-block") return true;
    return false;
  });

  const btn =
    "grid h-8 w-8 place-items-center rounded-full text-stone-400 transition-colors hover:bg-white/10 hover:text-ink";

  return (
    <div className="pointer-events-auto absolute bottom-5 left-1/2 flex -translate-x-1/2 animate-fade-up items-center gap-1 rounded-full border border-glass-border bg-glass px-2 py-1.5 shadow-float backdrop-blur-md">
      <button
        type="button"
        title={
          artboard
            ? `Area kerja ${artboard.width} × ${artboard.height} px — buka Studio Desain untuk mengubah`
            : "Buka Studio Desain — pilih ukuran kanvas"
        }
        className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium tabular-nums text-stone-300 transition-colors hover:bg-white/10 hover:text-ink"
        onClick={onOpenStudio}
      >
        <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden>
          <path
            d="M4 1v10M8 1v10M1 4h10M1 8h10"
            stroke="currentColor"
            strokeWidth="1.3"
            strokeLinecap="round"
          />
        </svg>
        {artboard ? `${artboard.width}×${artboard.height}` : "Studio"}
      </button>

      <span className="mx-1 h-4 w-px bg-white/10" aria-hidden />

      <button
        type="button"
        className={btn}
        aria-label="Perkecil"
        onClick={() => engineRef.current?.zoomBy(0.8)}
      >
        <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden>
          <path
            d="M2 6h8"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
          />
        </svg>
      </button>

      <button
        type="button"
        className="min-w-14 rounded-full px-2 py-1 text-center text-xs font-medium tabular-nums text-stone-300 transition-colors hover:bg-white/10"
        title="Pas-kan tampilan (fit ke area kerja)"
        onClick={() => engineRef.current?.resetView()}
      >
        {Math.round(scale * 100)}%
      </button>

      <button
        type="button"
        className={btn}
        aria-label="Perbesar"
        onClick={() => engineRef.current?.zoomBy(1.25)}
      >
        <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden>
          <path
            d="M6 2v8M2 6h8"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
          />
        </svg>
      </button>

      <span className="mx-1 h-4 w-px bg-white/10" aria-hidden />

      <button
        type="button"
        disabled={!hasBlocks}
        title={
          hasBlocks
            ? "Ekspor blok HTML menjadi index.html + style.css (W-FR-3.4)"
            : "Sisipkan blok HTML dulu dari palet di kiri"
        }
        className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold text-accent transition-colors hover:bg-accent-soft disabled:cursor-not-allowed disabled:text-stone-600 disabled:hover:bg-transparent"
        onClick={() => void exportSiteZip(useCanvasStore.getState().objects)}
      >
        <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden>
          <path
            d="M6 1.5v6m0 0L3.5 5M6 7.5 8.5 5M2 10.5h8"
            stroke="currentColor"
            strokeWidth="1.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        Ekspor .zip
      </button>

      <span className="mx-1 h-4 w-px bg-white/10" aria-hidden />

      <p className="hidden items-center gap-1.5 whitespace-nowrap pr-2 text-[11px] text-stone-500 sm:flex">
        <kbd>Scroll</kbd> zoom · <kbd>Spasi</kbd>+geser pan · seret file ke
        kanvas
      </p>
    </div>
  );
}
