"use client";

import { PLATFORM_LABEL, VELOCITY_LABEL } from "@/lib/trends/trendData";
import type { AestheticMatchResult } from "@/lib/trends/aestheticMatch";
import { GlassPanel } from "@/components/ui/GlassPanel";

/** Hasil Vibe-Match Radar — daftar tren yang cocok dengan tag terdeteksi. */
export function RadarPopover({
  result,
  onClose,
}: {
  result: AestheticMatchResult;
  onClose: () => void;
}) {
  return (
    <GlassPanel className="max-h-[40vh] w-[min(15rem,calc(100vw-1.5rem))] animate-fade-up overflow-y-auto p-3 scrollbar-thin sm:w-60">
      <div className="mb-2 flex items-center justify-between gap-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-ink-subtle">
          Vibe-Match Radar
        </p>
        <button
          type="button"
          onClick={onClose}
          aria-label="Tutup Radar"
          className="grid h-8 w-8 place-items-center rounded-full text-ink-muted transition-colors hover:bg-black/5 hover:text-ink active:scale-90 sm:h-6 sm:w-6"
        >
          ×
        </button>
      </div>

      {result.tags.length === 0 ? (
        <p className="text-[11px] text-ink-muted">
          Tambahkan blok berwarna atau teks di kanvas dulu supaya Radar punya
          sesuatu untuk dicocokkan.
        </p>
      ) : (
        <>
          <div className="mb-2 flex flex-wrap gap-1">
            {result.tags.map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-accent-soft px-2 py-0.5 text-[10px] font-semibold text-accent"
              >
                {tag}
              </span>
            ))}
          </div>
          {result.matches.length === 0 ? (
            <p className="text-[11px] text-ink-muted">
              Tidak ada tren yang cocok saat ini.
            </p>
          ) : (
            <ul className="flex flex-col gap-1.5">
              {result.matches.map((item) => (
                <li
                  key={item.id}
                  className="flex items-center gap-2 rounded-lg border border-glass-border-subtle bg-white/50 p-1.5"
                >
                  <span
                    className="h-6 w-6 shrink-0 rounded-md"
                    style={{ background: item.thumbnail }}
                    aria-hidden
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[11px] font-medium text-ink">
                      {item.title}
                    </span>
                    <span className="block truncate text-[10px] text-ink-subtle">
                      {PLATFORM_LABEL[item.platform]} · {VELOCITY_LABEL[item.velocity]}
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </GlassPanel>
  );
}
