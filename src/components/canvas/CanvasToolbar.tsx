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
}: {
  engineRef: RefObject<CanvasEngine | null>;
}) {
  const scale = useCanvasStore((s) => s.camera.scale);
  const hasBlocks = useCanvasStore((s) => {
    for (const o of s.objects.values()) if (o.type === "html-block") return true;
    return false;
  });

  const btn =
    "grid h-8 w-8 place-items-center rounded-full text-stone-600 transition-colors hover:bg-stone-100 hover:text-ink";

  return (
    <div className="pointer-events-auto absolute bottom-5 left-1/2 flex -translate-x-1/2 items-center gap-1 rounded-full border border-stone-200 bg-white/90 px-2 py-1.5 shadow-lg shadow-stone-900/5 backdrop-blur">
      <button
        type="button"
        className={btn}
        aria-label="Perkecil"
        onClick={() => engineRef.current?.zoomBy(0.8)}
      >
        −
      </button>

      <button
        type="button"
        className="min-w-14 rounded-full px-2 py-1 text-center text-xs font-medium tabular-nums text-stone-600 transition-colors hover:bg-stone-100"
        title="Kembali ke 100%"
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
        +
      </button>

      <span className="mx-1 h-4 w-px bg-stone-200" aria-hidden />

      <button
        type="button"
        disabled={!hasBlocks}
        title={
          hasBlocks
            ? "Ekspor blok HTML menjadi index.html + style.css (W-FR-3.4)"
            : "Sisipkan blok HTML dulu dari palet di kiri"
        }
        className="rounded-full px-3 py-1 text-xs font-semibold text-accent transition-colors hover:bg-accent-soft disabled:cursor-not-allowed disabled:text-stone-300 disabled:hover:bg-transparent"
        onClick={() => void exportSiteZip(useCanvasStore.getState().objects)}
      >
        Ekspor .zip
      </button>

      <span className="mx-1 h-4 w-px bg-stone-200" aria-hidden />

      <p className="hidden pr-2 text-[11px] text-stone-400 sm:block">
        Scroll: zoom · Klik kanan / Spasi + geser: pan · Seret file ke kanvas
      </p>
    </div>
  );
}
