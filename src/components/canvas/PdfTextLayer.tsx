"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useCanvasStore } from "@/stores/canvasStore";
import type { CanvasObject, PdfTextRun } from "@/types/canvas";

/**
 * PdfTextLayer (W-FR-3.1 — "ketik ulang di atas PDF").
 *
 * Overlay DOM di atas <canvas> yang menampilkan potongan teks berposisi
 * (data.textRuns) dari halaman PDF yang sedang dipilih, sebagai field yang
 * bisa diedit. Posisi diproyeksikan dari page-local world px -> layar memakai
 * kamera dari store (pola sama dengan MultiplayerCursors), jadi lapisan ini
 * menempel pada halaman saat pan/zoom.
 *
 * Alur: pilih halaman PDF di kanvas -> panel "Ketik ulang teks" muncul ->
 * aktifkan -> tiap potongan teks jadi input dengan latar putih yang menutupi
 * glyph asli, terisi teks asli, siap diganti. Perubahan ditulis balik ke
 * store (tersinkron Y.js & bertahan) tanpa mengubah raster PDF di bawahnya.
 */
export function PdfTextLayer() {
  const objects = useCanvasStore((s) => s.objects);
  const selectedIds = useCanvasStore((s) => s.selectedIds);
  const camera = useCanvasStore((s) => s.camera);

  const [annotatingId, setAnnotatingId] = useState<string | null>(null);
  const [edits, setEdits] = useState<Record<number, string>>({});
  const editsRef = useRef(edits);
  editsRef.current = edits;

  /** Halaman PDF tunggal yang dipilih & punya teks berposisi. */
  const page = useMemo<CanvasObject | null>(() => {
    if (selectedIds.size !== 1) return null;
    const id = [...selectedIds][0];
    const o = objects.get(id);
    if (!o || o.type !== "pdf-page") return null;
    const runs = o.data.textRuns as PdfTextRun[] | undefined;
    return runs && runs.length > 0 ? o : null;
  }, [selectedIds, objects]);

  const runs = (page?.data.textRuns as PdfTextRun[] | undefined) ?? [];
  const annotating = page !== null && annotatingId === page.id;

  // Keluar dari mode edit bila seleksi berpindah dari halaman yang diedit.
  useEffect(() => {
    if (annotatingId && (!page || page.id !== annotatingId)) {
      setAnnotatingId(null);
    }
  }, [page, annotatingId]);

  if (!page) return null;

  const commit = (): void => {
    const o = useCanvasStore.getState().objects.get(page.id);
    if (!o) return;
    const current = (o.data.textRuns as PdfTextRun[] | undefined) ?? [];
    const nextRuns = current.map((r, i) => ({
      ...r,
      text: editsRef.current[i] ?? r.text,
    }));
    useCanvasStore.getState().updateObject(page.id, {
      data: {
        ...o.data,
        textRuns: nextRuns,
        text: nextRuns
          .map((r) => r.text)
          .join(" ")
          .replace(/\s+/g, " ")
          .trim(),
      },
    });
  };

  const startAnnotate = (): void => {
    setEdits(Object.fromEntries(runs.map((r, i) => [i, r.text])));
    setAnnotatingId(page.id);
  };

  const stopAnnotate = (): void => {
    commit();
    setAnnotatingId(null);
  };

  const s = camera.scale;

  return (
    <>
      {/* Field teks — hanya saat mode edit aktif. */}
      {annotating && (
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          {runs.map((run, i) => {
            const left = (page.x + run.x) * s + camera.x;
            const top = (page.y + run.y) * s + camera.y;
            const h = run.h * s;
            // Sembunyikan run yang jauh di luar layar (hemat DOM & input).
            if (
              left > window.innerWidth + 200 ||
              top > window.innerHeight + 200 ||
              left + run.w * s < -200 ||
              top + h < -200 ||
              h < 4
            ) {
              return null;
            }
            return (
              <input
                key={i}
                type="text"
                value={edits[i] ?? run.text}
                onChange={(e) =>
                  setEdits((prev) => ({ ...prev, [i]: e.target.value }))
                }
                onBlur={commit}
                onKeyDown={(e) => {
                  if (e.key === "Escape") (e.target as HTMLInputElement).blur();
                }}
                spellCheck={false}
                className="pointer-events-auto absolute rounded-[2px] border-0 bg-white/95 px-[1px] text-stone-900 outline-none ring-1 ring-accent/40 focus:ring-2 focus:ring-accent"
                style={{
                  left: `${left}px`,
                  top: `${top}px`,
                  width: `${Math.max(run.w * s, 8)}px`,
                  height: `${h}px`,
                  fontSize: `${Math.max(6, h * 0.82)}px`,
                  lineHeight: `${h}px`,
                  fontFamily: "system-ui, sans-serif",
                }}
              />
            );
          })}
        </div>
      )}

      {/* Panel kontrol — muncul saat halaman PDF terpilih. */}
      <div className="pointer-events-auto absolute left-1/2 top-4 flex -translate-x-1/2 animate-fade-in items-center gap-2 rounded-full border border-glass-border bg-glass px-2 py-1.5 shadow-float backdrop-blur-md">
        <span className="flex items-center gap-1.5 pl-2 text-[11px] text-stone-400">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path
              d="M7 3h7l4 4v14H7z M14 3v4h4"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinejoin="round"
            />
          </svg>
          {String(page.data.name ?? "PDF")} · hal{" "}
          {Number(page.data.pageIndex ?? 0) + 1}/
          {Number(page.data.totalPages ?? 1)}
        </span>
        <span className="h-4 w-px bg-white/10" aria-hidden />
        {annotating ? (
          <button
            type="button"
            onClick={stopAnnotate}
            className="rounded-full bg-accent px-3 py-1 text-xs font-semibold text-teal-950 transition-opacity hover:opacity-90"
          >
            Selesai
          </button>
        ) : (
          <button
            type="button"
            onClick={startAnnotate}
            className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold text-accent transition-colors hover:bg-accent-soft"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path
                d="m4 20 .8-3.2L16.6 5a1.9 1.9 0 0 1 2.7 2.7L7.5 19.2z"
                stroke="currentColor"
                strokeWidth="1.7"
                strokeLinejoin="round"
              />
            </svg>
            Ketik ulang teks
          </button>
        )}
      </div>
    </>
  );
}
