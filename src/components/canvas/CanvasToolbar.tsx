"use client";

import { useEffect, useRef, useState, type RefObject } from "react";
import Link from "next/link";
import type { CanvasEngine } from "@/lib/engine/CanvasEngine";
import { exportSiteZip } from "@/lib/export/exportZip";
import { listProjects } from "@/lib/projects/localProjects";
import { addSnapshotStory } from "@/lib/profile/profileData";
import { useCanvasStore } from "@/stores/canvasStore";

/**
 * Kontrol kamera memanggil API engine (bukan menulis store langsung) —
 * engine adalah satu-satunya penulis transformasi world, store hanya cermin.
 * Persentase zoom dibaca reaktif dari store.
 */
export function CanvasToolbar({
  engineRef,
  projectId,
  onOpenStudio,
}: {
  engineRef: RefObject<CanvasEngine | null>;
  projectId: string;
  onOpenStudio: () => void;
}) {
  const scale = useCanvasStore((s) => s.camera.scale);
  const artboard = useCanvasStore((s) => s.artboard);
  const hasBlocks = useCanvasStore((s) => {
    for (const o of s.objects.values()) if (o.type === "html-block") return true;
    return false;
  });
  const [toast, setToast] = useState<{ ok: boolean; msg: string } | null>(null);
  const [exporting, setExporting] = useState(false);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (toastTimer.current) clearTimeout(toastTimer.current);
    },
    [],
  );

  const showToast = (ok: boolean, msg: string): void => {
    setToast({ ok, msg });
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 3200);
  };

  /** "Secure Snapshot" kanvas -> Story 24 jam (PRD Addendum 03). */
  const shareStory = (): void => {
    const image = engineRef.current?.snapshotDataUrl();
    if (!image) {
      showToast(false, "Snapshot gagal — coba lagi.");
      return;
    }
    const name = listProjects().find((p) => p.id === projectId)?.name;
    const story = addSnapshotStory({ image, projectId, projectName: name });
    showToast(
      story !== null,
      story
        ? "Story dibagikan · tayang 24 jam ✨"
        : "Penyimpanan penuh — story tidak tersimpan.",
    );
  };

  const btn =
    "grid h-9 w-9 place-items-center rounded-full text-ink-muted transition-colors hover:bg-black/5 hover:text-ink active:scale-90 sm:h-8 sm:w-8";

  return (
    // max-w + label ikon-only di bawah sm: seluruh kontrol muat di 375px
    // (sebelumnya konten ~480px meluber dua sisi). Offset bawah aman dari
    // home-indicator via --kv-safe-b.
    // inset-x-0 + mx-auto + w-fit (BUKAN left-1/2 -translate-x-1/2):
    // animasi fade-up ber-fill "both" menimpa properti transform, sehingga
    // translate centering tidak pernah berlaku — toolbar melenceng ke kanan.
    <div className="pointer-events-auto absolute inset-x-0 bottom-[calc(0.75rem+var(--kv-safe-b))] mx-auto flex w-fit max-w-[calc(100vw-1rem)] animate-fade-up items-center gap-0.5 rounded-full border border-glass-border bg-glass px-1.5 py-1.5 shadow-float backdrop-blur-md sm:bottom-5 sm:gap-1 sm:px-2">
      <button
        type="button"
        title={
          artboard
            ? `Area kerja ${artboard.width} × ${artboard.height} px — buka Studio Desain untuk mengubah`
            : "Buka Studio Desain — pilih ukuran kanvas"
        }
        className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-2 text-xs font-medium tabular-nums text-ink-muted transition-colors hover:bg-black/5 hover:text-ink sm:px-3 sm:py-1"
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

      <span className="mx-1 h-4 w-px bg-glass-border-subtle" aria-hidden />

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
        className="min-w-12 rounded-full px-2 py-2 text-center text-xs font-medium tabular-nums text-ink-muted transition-colors hover:bg-black/5 hover:text-ink sm:min-w-14 sm:py-1"
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

      <span className="mx-1 h-4 w-px bg-glass-border-subtle" aria-hidden />

      <button
        type="button"
        aria-disabled={!hasBlocks}
        aria-label="Ekspor .zip"
        title={
          hasBlocks
            ? "Ekspor blok HTML menjadi index.html + style.css (W-FR-3.4)"
            : "Sisipkan blok HTML dulu dari palet di kiri"
        }
        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-2 text-xs font-semibold transition-colors sm:px-3 sm:py-1 ${
          hasBlocks
            ? "text-accent hover:bg-accent-soft"
            : "cursor-not-allowed text-ink-subtle"
        }`}
        onClick={() => {
          // Tetap bisa diketuk saat nonaktif: di layar sentuh tidak ada
          // tooltip hover, jadi alasannya disampaikan lewat toast.
          if (!hasBlocks) {
            showToast(false, "Sisipkan blok HTML dulu dari palet di kiri.");
            return;
          }
          if (exporting) return;
          // Notif loading di layar: kanvas besar butuh waktu zip — tombol
          // menampilkan spinner sampai file benar-benar terunduh.
          setExporting(true);
          void exportSiteZip(useCanvasStore.getState().objects)
            .catch(() => showToast(false, "Ekspor gagal — coba lagi."))
            .finally(() => setExporting(false));
        }}
      >
        {exporting ? (
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden
            className="animate-spin motion-reduce:animate-none"
          >
            <circle
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
              strokeDasharray="32"
              strokeDashoffset="12"
            />
          </svg>
        ) : (
          <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden>
            <path
              d="M6 1.5v6m0 0L3.5 5M6 7.5 8.5 5M2 10.5h8"
              stroke="currentColor"
              strokeWidth="1.4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}
        <span className="hidden sm:inline">
          {exporting ? "Mengekspor…" : "Ekspor .zip"}
        </span>
      </button>

      <button
        type="button"
        aria-label="Bagikan Story"
        title="Bagikan snapshot kanvas sebagai Story (24 jam)"
        className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-2 text-xs font-semibold text-mint transition-colors hover:bg-mint-soft sm:px-3 sm:py-1"
        onClick={shareStory}
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden>
          <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1.8" />
          <path
            d="M12 2a10 10 0 0 1 10 10M12 22A10 10 0 0 1 2 12"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeDasharray="3 3"
          />
        </svg>
        <span className="hidden sm:inline">Story</span>
      </button>

      <span className="mx-1 hidden h-4 w-px bg-glass-border-subtle sm:block" aria-hidden />

      <p className="hidden items-center gap-1.5 whitespace-nowrap pr-2 text-[11px] text-ink-subtle sm:flex">
        <kbd>Scroll</kbd> zoom · <kbd>Spasi</kbd>+geser pan · seret file ke
        kanvas
      </p>

      {/* Toast feedback — muncul di atas toolbar, hilang otomatis. */}
      {toast && (
        <div
          role="status"
          className={`absolute bottom-full left-1/2 mb-3 flex max-w-[calc(100vw-2rem)] -translate-x-1/2 flex-wrap items-center justify-center gap-2 rounded-2xl border px-4 py-2 text-center text-xs font-medium shadow-float backdrop-blur-md sm:whitespace-nowrap sm:rounded-full ${
            toast.ok
              ? "border-accent/30 bg-glass text-accent"
              : "border-rose-400/30 bg-glass text-rose-500"
          }`}
        >
          {toast.msg}
          {toast.ok && (
            <Link
              href="/profile/kahfi"
              className="rounded-full bg-accent-soft px-2 py-0.5 font-semibold text-accent transition-colors hover:bg-accent/20"
            >
              Lihat
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
