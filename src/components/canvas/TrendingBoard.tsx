"use client";

import { useEffect, useState } from "react";
import { useCanvasStore } from "@/stores/canvasStore";
import {
  PLATFORM_LABEL,
  TREND_CATALOG,
  VELOCITY_LABEL,
  type TrendItem,
} from "@/lib/trends/trendData";
import { matchAesthetic } from "@/lib/trends/aestheticMatch";
import { RadarPopover } from "./RadarPopover";

const STORAGE_KEY = "kvolve:trending-board-expanded";

/** Event koordinasi antar-board bawah (Tren ↔ Skor AI): di layar sempit
 *  keduanya terbuka bersamaan akan saling tumpang-tindih, jadi salah satu
 *  menutup saat yang lain dibuka. Tanpa store baru — cukup CustomEvent. */
export const BOARD_EXPAND_EVENT = "kv:board-expand";

/**
 * Micro-Trending Board — panel kaca mengambang di pojok kanan-bawah editor
 * (satu-satunya kuadran yang belum dipakai CanvasNavbar/BlockPalette/
 * CodeInspector/CanvasToolbar). Tertutup secara default (state diingat lewat
 * localStorage) agar tidak memenuhi kanvas bagi pengguna yang belum butuh.
 *
 * "Terapkan Gaya" menyuntikkan warna dominan tren ke latar artboard aktif
 * lewat `setArtboardBackgroundColor` — no-op bila belum ada artboard.
 */
export function TrendingBoard() {
  const artboard = useCanvasStore((s) => s.artboard);
  const setArtboardBackgroundColor = useCanvasStore(
    (s) => s.setArtboardBackgroundColor,
  );
  const objects = useCanvasStore((s) => s.objects);
  const [expanded, setExpanded] = useState(false);
  const [radarOpen, setRadarOpen] = useState(false);

  useEffect(() => {
    try {
      setExpanded(window.localStorage.getItem(STORAGE_KEY) === "1");
    } catch {
      /* localStorage diblokir — biarkan default tertutup */
    }
  }, []);

  // Tutup bila board lain terbuka di layar sempit (tanpa menimpa preferensi
  // tersimpan — hanya state sesi ini).
  useEffect(() => {
    const onOther = (e: Event): void => {
      if (
        (e as CustomEvent<string>).detail !== "tren" &&
        window.innerWidth < 640
      ) {
        setExpanded(false);
      }
    };
    window.addEventListener(BOARD_EXPAND_EVENT, onOther);
    return () => window.removeEventListener(BOARD_EXPAND_EVENT, onOther);
  }, []);

  const toggle = (): void => {
    const next = !expanded;
    setExpanded(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, next ? "1" : "0");
    } catch {
      /* abaikan storage penuh/terblokir */
    }
    // Dispatch di LUAR updater state: updater dijalankan dua kali di Strict
    // Mode dan event listener yang men-setState dari dalam updater bisa
    // tertimpa antrean batch yang sama.
    if (next) {
      window.dispatchEvent(
        new CustomEvent(BOARD_EXPAND_EVENT, { detail: "tren" }),
      );
    }
  };

  const applyStyle = (item: TrendItem): void => {
    if (!artboard) return;
    setArtboardBackgroundColor(item.dominantColor);
  };

  const radarResult = radarOpen ? matchAesthetic(objects) : null;

  return (
    <div
      data-kv-decorative
      className="pointer-events-auto absolute bottom-[calc(4.5rem+var(--kv-safe-b))] right-3 flex flex-col items-end gap-2 sm:bottom-20 sm:right-4"
    >
      {radarOpen && radarResult && (
        <RadarPopover result={radarResult} onClose={() => setRadarOpen(false)} />
      )}

      {expanded && (
        <div className="scrollbar-thin max-h-[min(60vh,calc(100dvh-11rem))] w-[min(15rem,calc(100vw-1.5rem))] animate-fade-up overflow-y-auto rounded-2xl border border-glass-border bg-glass p-3 shadow-float backdrop-blur-md sm:w-60">
          <div className="mb-2 flex items-center justify-between gap-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-ink-subtle">
              Tren
            </p>
            <button
              type="button"
              onClick={() => setRadarOpen((r) => !r)}
              title="Vibe-Match Radar — cocokkan warna & teks kanvas dengan tren"
              className="inline-flex items-center gap-1 rounded-full bg-accent-soft px-2.5 py-1.5 text-[10px] font-semibold text-accent transition-colors hover:bg-accent/20 active:scale-95 sm:py-0.5"
            >
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" aria-hidden>
                <circle cx="12" cy="12" r="8.5" stroke="currentColor" strokeWidth="1.7" />
                <path d="M12 12 17 8" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
              </svg>
              Radar
            </button>
          </div>

          <ul className="flex flex-col gap-2">
            {TREND_CATALOG.map((item) => (
              <li
                key={item.id}
                className="rounded-xl border border-glass-border-subtle bg-white/50 p-2"
              >
                <div
                  className="h-12 w-full rounded-lg"
                  style={{ background: item.thumbnail }}
                  aria-hidden
                />
                <div className="mt-1.5 flex items-center justify-between gap-1">
                  <span className="text-[10px] font-semibold uppercase tracking-wide text-ink-subtle">
                    {PLATFORM_LABEL[item.platform]}
                  </span>
                  <span className="text-[10px] text-ink-subtle">
                    {VELOCITY_LABEL[item.velocity]}
                  </span>
                </div>
                <p className="mt-0.5 truncate text-xs font-medium text-ink">
                  {item.title}
                </p>
                <p className="truncate text-xs text-ink-muted">
                  {item.hashtag}
                  {item.audioLabel ? ` · ${item.audioLabel}` : ""}
                </p>
                <button
                  type="button"
                  disabled={!artboard}
                  onClick={() => applyStyle(item)}
                  title={
                    artboard
                      ? "Terapkan warna dominan ke latar artboard"
                      : "Pilih ukuran kanvas dulu (Studio Desain)"
                  }
                  className="mt-1.5 w-full rounded-lg bg-accent-soft px-2 py-2 text-[11px] font-semibold text-accent transition-colors hover:bg-accent/20 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-accent-soft sm:py-1"
                >
                  Terapkan Gaya
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      <button
        type="button"
        onClick={toggle}
        aria-expanded={expanded}
        aria-label={expanded ? "Tutup panel Tren" : "Buka panel Tren"}
        className="flex items-center gap-1.5 rounded-full border border-glass-border bg-glass px-3.5 py-2 text-xs font-medium text-ink-muted shadow-float backdrop-blur-md transition-colors hover:text-ink active:scale-95 sm:px-3 sm:py-1.5"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
          <path
            d="M3 17l6-6 4 4 8-8M21 7h-6m6 0v6"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        Tren
      </button>
    </div>
  );
}
