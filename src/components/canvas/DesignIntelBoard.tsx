"use client";

import { useEffect, useRef, useState } from "react";
import { useCanvasStore } from "@/stores/canvasStore";
import { getActiveTheme, subscribeTheme } from "@/lib/themes/themeStore";
import { scoreDesign, type DesignIntelResult } from "@/lib/design-intel/scoreDesign";
import { BOARD_EXPAND_EVENT } from "./TrendingBoard";

const STORAGE_KEY = "kvolve:design-intel-expanded";
const DEBOUNCE_MS = 800;

const BARS: { key: keyof Pick<DesignIntelResult, "attention" | "conversion" | "brand">; label: string }[] = [
  { key: "attention", label: "Perhatian" },
  { key: "conversion", label: "Konversi" },
  { key: "brand", label: "Brand" },
];

/** "37 99 235" (kontrak var --kv-*) -> "#2563eb" untuk scoreDesign(). */
function tripletToHex(triplet: string | undefined): string | null {
  if (!triplet) return null;
  const parts = triplet.trim().split(/\s+/).map(Number);
  if (parts.length !== 3 || parts.some((n) => Number.isNaN(n))) return null;
  return `#${parts.map((n) => Math.max(0, Math.min(255, n)).toString(16).padStart(2, "0")).join("")}`;
}

/**
 * Panel skor AI Design Intelligence — pil "Skor AI" mengambang di pojok
 * kiri-bawah editor (kuadran bebas: kanan-bawah sudah dipakai TrendingBoard).
 * READ-ONLY terhadap useCanvasStore — hanya selector, nol mutasi store, nol
 * import engine. Skor dihitung ulang (debounce 800ms) hanya saat panel
 * terbuka, mengikuti perubahan objects/artboard/tema aktif.
 */
export function DesignIntelBoard() {
  const objects = useCanvasStore((s) => s.objects);
  const artboard = useCanvasStore((s) => s.artboard);
  const [expanded, setExpanded] = useState(false);
  const [result, setResult] = useState<DesignIntelResult | null>(null);
  const [accentHex, setAccentHex] = useState<string | null>(() =>
    tripletToHex(getActiveTheme().vars["--kv-accent"]),
  );
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    try {
      setExpanded(window.localStorage.getItem(STORAGE_KEY) === "1");
    } catch {
      /* localStorage diblokir — biarkan default tertutup */
    }
  }, []);

  // Tutup bila panel Tren dibuka di layar sempit — keduanya saling
  // menumpuk di bawah 640px (lihat BOARD_EXPAND_EVENT di TrendingBoard).
  useEffect(() => {
    const onOther = (e: Event): void => {
      if (
        (e as CustomEvent<string>).detail !== "skor" &&
        window.innerWidth < 640
      ) {
        setExpanded(false);
      }
    };
    window.addEventListener(BOARD_EXPAND_EVENT, onOther);
    return () => window.removeEventListener(BOARD_EXPAND_EVENT, onOther);
  }, []);

  useEffect(
    () =>
      subscribeTheme(() => {
        setAccentHex(tripletToHex(getActiveTheme().vars["--kv-accent"]));
      }),
    [],
  );

  useEffect(() => {
    if (!expanded) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setResult(scoreDesign(objects, artboard, accentHex));
    }, DEBOUNCE_MS);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [expanded, objects, artboard, accentHex]);

  const toggle = (): void => {
    const next = !expanded;
    setExpanded(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, next ? "1" : "0");
    } catch {
      /* abaikan storage penuh/terblokir */
    }
    // Dispatch di luar updater — alasan sama dengan TrendingBoard.toggle.
    if (next) {
      window.dispatchEvent(
        new CustomEvent(BOARD_EXPAND_EVENT, { detail: "skor" }),
      );
    }
  };

  const refresh = (): void => {
    setResult(scoreDesign(objects, artboard, accentHex));
  };

  return (
    <div
      data-kv-decorative
      className="pointer-events-auto absolute bottom-[calc(4.5rem+var(--kv-safe-b))] left-3 flex flex-col items-start gap-2 sm:bottom-20 sm:left-4"
    >
      {expanded && (
        <div className="scrollbar-thin max-h-[min(60vh,calc(100dvh-11rem))] w-[min(15rem,calc(100vw-1.5rem))] animate-fade-up overflow-y-auto rounded-2xl border border-glass-border bg-glass p-3 shadow-float backdrop-blur-md sm:w-60">
          <div className="mb-2 flex items-center justify-between gap-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-ink-subtle">
              Skor AI
            </p>
            <button
              type="button"
              onClick={refresh}
              title="Segarkan skor"
              className="inline-flex items-center gap-1 rounded-full bg-accent-soft px-2.5 py-1.5 text-[10px] font-semibold text-accent transition-colors hover:bg-accent/20 active:scale-95 sm:py-0.5"
            >
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" aria-hidden>
                <path
                  d="M4 4v5h5M20 20v-5h-5M4.5 15a8 8 0 0 0 14.5 3M19.5 9A8 8 0 0 0 5 6"
                  stroke="currentColor"
                  strokeWidth="1.7"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              Segarkan
            </button>
          </div>

          {result ? (
            <>
              <p className="mb-2 text-2xl font-semibold text-ink">
                {result.overall}
                <span className="ml-1 text-xs font-normal text-ink-muted">/100</span>
              </p>
              <div className="flex flex-col gap-2">
                {BARS.map(({ key, label }) => (
                  <div key={key}>
                    <div className="mb-0.5 flex items-center justify-between">
                      <span className="text-[11px] font-medium text-ink-muted">{label}</span>
                      <span className="text-[11px] font-semibold text-ink">
                        {result[key].score}
                      </span>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-canvas-soft">
                      <div
                        className="h-full rounded-full bg-accent transition-[width] duration-300"
                        style={{ width: `${result[key].score}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>

              {(() => {
                const tips = [...result.attention.tips, ...result.conversion.tips, ...result.brand.tips];
                return tips.length > 0 ? (
                  <ul className="mt-3 flex flex-col gap-1 border-t border-glass-border-subtle pt-2">
                    {tips.slice(0, 4).map((tip, i) => (
                      <li key={i} className="text-xs leading-snug text-ink-muted">
                        · {tip}
                      </li>
                    ))}
                  </ul>
                ) : null;
              })()}
            </>
          ) : (
            <p className="text-[11px] text-ink-muted">Menghitung…</p>
          )}
        </div>
      )}

      <button
        type="button"
        onClick={toggle}
        aria-expanded={expanded}
        aria-label={expanded ? "Tutup panel Skor AI" : "Buka panel Skor AI"}
        className="flex items-center gap-1.5 rounded-full border border-glass-border bg-glass px-3.5 py-2 text-xs font-medium text-ink-muted shadow-float backdrop-blur-md transition-colors hover:text-ink active:scale-95 sm:px-3 sm:py-1.5"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
          <path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
        </svg>
        Skor AI
      </button>
    </div>
  );
}
