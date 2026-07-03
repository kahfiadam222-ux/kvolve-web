"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type RefObject,
} from "react";
import type { CanvasEngine } from "@/lib/engine/CanvasEngine";
import { KvolveMark } from "@/components/brand/KvolveMark";
import {
  MAX_ARTBOARD_PX,
  MIN_ARTBOARD_PX,
  PRESET_CATEGORIES,
  PRINT_DPI,
  cmToPx,
  type PresetIconKey,
} from "@/lib/presets/canvasPresets";
import { PRESET_ICONS } from "./PresetIcons";

/**
 * Design Studio — dashboard pemilihan ukuran kanvas.
 *
 * Modal glass gelap yang muncul saat kanvas dibuka (dan bisa dibuka ulang
 * dari toolbar). Dua jalur sesuai spesifikasi:
 * 1. Desain Manual (Custom Size): input Lebar × Tinggi dalam px / cm
 *    (cm dikonversi pada 300 DPI) + tombol "Buat Kanvas Baru".
 * 2. Template Ukuran Instan per kategori, masing-masing dengan ikon
 *    platform + keterangan dimensi, plus toggle balik orientasi
 *    (Portrait ⇄ Landscape) yang berlaku sebelum kanvas dibuat.
 *
 * Klik pilihan mana pun langsung memanggil CanvasEngine.setArtboard()
 * sehingga bounding box area kerja berubah dinamis tanpa reload.
 */

type TabId = "custom" | (typeof PRESET_CATEGORIES)[number]["id"];

const CATEGORY_ICON: Record<string, PresetIconKey> = {
  social: "instagram",
  business: "presentation",
  branding: "resume",
  marketing: "poster",
};

const pxToCm = (px: number): number =>
  Math.round(((px / PRINT_DPI) * 2.54) * 10) / 10;

export function DesignStudio({
  engineRef,
  open,
  onClose,
}: {
  engineRef: RefObject<CanvasEngine | null>;
  open: boolean;
  onClose: () => void;
}) {
  const [tab, setTab] = useState<TabId>("custom");
  const [flipped, setFlipped] = useState(false);
  const [unit, setUnit] = useState<"px" | "cm">("px");
  // Sumber kebenaran = piksel (wPx/hPx). Draft string hanya untuk mengetik
  // di satuan aktif; mengganti satuan TIDAK menyentuh px kanonik, sehingga
  // round-trip px→cm→px tidak pernah menggeser ukuran yang dimasukkan.
  const [wPx, setWPx] = useState<number | null>(1080);
  const [hPx, setHPx] = useState<number | null>(1080);
  const [widthStr, setWidthStr] = useState("1080");
  const [heightStr, setHeightStr] = useState("1080");

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent): void => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  /** Terapkan ukuran ke engine — satu-satunya pintu keluar modal ini. */
  const apply = useCallback(
    (width: number, height: number) => {
      engineRef.current?.setArtboard(width, height);
      onClose();
    },
    [engineRef, onClose],
  );

  // ------------------------------------------------------- custom size

  const customPx = useMemo(
    () => (wPx !== null && hPx !== null ? { width: wPx, height: hPx } : null),
    [wPx, hPx],
  );

  const customValid =
    customPx !== null &&
    customPx.width >= MIN_ARTBOARD_PX &&
    customPx.width <= MAX_ARTBOARD_PX &&
    customPx.height >= MIN_ARTBOARD_PX &&
    customPx.height <= MAX_ARTBOARD_PX;

  /** Edit satu field: perbarui draft + turunkan px kanonik dari satuan aktif. */
  const editDim =
    (setDraft: (v: string) => void, setPx: (v: number | null) => void) =>
    (raw: string): void => {
      setDraft(raw);
      const n = Number.parseFloat(raw.replace(",", "."));
      if (!Number.isFinite(n)) return setPx(null);
      setPx(unit === "cm" ? cmToPx(n) : Math.round(n));
    };

  const draftFor = (px: number | null, u: "px" | "cm"): string =>
    px === null ? "" : u === "cm" ? String(pxToCm(px)) : String(px);

  const switchUnit = (next: "px" | "cm"): void => {
    if (next === unit) return;
    // Regenerasi draft dari px kanonik — px tidak diubah, jadi tanpa drift.
    setWidthStr(draftFor(wPx, next));
    setHeightStr(draftFor(hPx, next));
    setUnit(next);
  };

  const swapCustom = (): void => {
    setWidthStr(heightStr);
    setHeightStr(widthStr);
    setWPx(hPx);
    setHPx(wPx);
  };

  if (!open) return null;

  const activeCategory = PRESET_CATEGORIES.find((c) => c.id === tab) ?? null;

  const orient = (w: number, h: number): [number, number] =>
    flipped ? [h, w] : [w, h];

  const inputCls =
    "w-full rounded-xl border border-glass-border bg-black/25 px-3 py-2 text-sm tabular-nums text-ink outline-none transition-all placeholder:text-stone-500 focus:border-accent/60 focus:ring-2 focus:ring-accent/20";

  return (
    <div
      className="fixed inset-0 z-50 flex animate-fade-in items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Studio Desain"
    >
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden
      />

      <div className="relative flex max-h-[min(40rem,calc(100dvh-2rem))] w-full max-w-3xl animate-fade-up overflow-hidden rounded-3xl border border-glass-border bg-glass shadow-float backdrop-blur-xl">
        {/* ------------------------------------------------ rail kategori */}
        <aside className="flex w-44 shrink-0 flex-col border-r border-glass-border bg-black/20 p-3">
          <div className="flex items-center gap-2 px-1.5 pb-4 pt-1">
            <KvolveMark className="h-6 w-6" />
            <div>
              <p className="text-[13px] font-semibold leading-tight">
                Studio Desain
              </p>
              <p className="text-[10px] text-stone-500">Pilih ukuran kanvas</p>
            </div>
          </div>

          <nav className="flex flex-col gap-1" aria-label="Kategori ukuran">
            <RailTab
              active={tab === "custom"}
              icon="custom"
              label="Desain Manual"
              onClick={() => setTab("custom")}
            />
            {PRESET_CATEGORIES.map((c) => (
              <RailTab
                key={c.id}
                active={tab === c.id}
                icon={CATEGORY_ICON[c.id] ?? "custom"}
                label={c.label}
                onClick={() => setTab(c.id as TabId)}
              />
            ))}
          </nav>

          <button
            type="button"
            onClick={onClose}
            className="mt-auto rounded-lg px-1.5 py-1 text-left text-[11px] text-stone-500 transition-colors hover:text-stone-300"
          >
            Lewati — mulai kanvas bebas
          </button>
        </aside>

        {/* --------------------------------------------------- konten tab */}
        <section className="scrollbar-thin flex-1 overflow-y-auto p-5">
          <header className="mb-4 flex items-center justify-between gap-3">
            <h2 className="text-sm font-semibold text-ink">
              {tab === "custom"
                ? "Desain Manual (Custom Size)"
                : activeCategory?.label}
            </h2>

            <div className="flex items-center gap-2">
              {tab !== "custom" && (
                <button
                  type="button"
                  aria-pressed={flipped}
                  onClick={() => setFlipped((f) => !f)}
                  title="Balikkan orientasi Portrait ⇄ Landscape sebelum kanvas dibuat"
                  className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-medium transition-all ${
                    flipped
                      ? "border-accent/50 bg-accent-soft text-accent"
                      : "border-glass-border text-stone-400 hover:bg-white/[0.06] hover:text-stone-200"
                  }`}
                >
                  <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden>
                    <path
                      d="M4.5 1.5 2 4l2.5 2.5M2 4h6a2.5 2.5 0 0 1 0 5H6"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.4"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  Balik orientasi
                </button>
              )}
              <button
                type="button"
                aria-label="Tutup Studio Desain"
                onClick={onClose}
                className="grid h-7 w-7 place-items-center rounded-full text-stone-400 transition-colors hover:bg-white/10 hover:text-ink"
              >
                ×
              </button>
            </div>
          </header>

          {tab === "custom" ? (
            <div className="max-w-sm animate-fade-in">
              <div
                className="inline-flex rounded-lg border border-glass-border bg-black/25 p-0.5"
                role="group"
                aria-label="Satuan ukuran"
              >
                {(["px", "cm"] as const).map((u) => (
                  <button
                    key={u}
                    type="button"
                    aria-pressed={unit === u}
                    onClick={() => switchUnit(u)}
                    className={`rounded-md px-3.5 py-1 text-xs font-medium transition-colors ${
                      unit === u
                        ? "bg-white/10 text-ink"
                        : "text-stone-500 hover:text-stone-300"
                    }`}
                  >
                    {u}
                  </button>
                ))}
              </div>

              <div className="mt-4 flex items-end gap-2">
                <label className="min-w-0 flex-1 text-xs text-stone-400">
                  Lebar ({unit})
                  <input
                    type="number"
                    inputMode="decimal"
                    min={0}
                    value={widthStr}
                    onChange={(e) => editDim(setWidthStr, setWPx)(e.target.value)}
                    className={`mt-1.5 ${inputCls}`}
                  />
                </label>
                <button
                  type="button"
                  onClick={swapCustom}
                  title="Tukar lebar ⇄ tinggi"
                  aria-label="Tukar lebar dan tinggi"
                  className="mb-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-glass-border text-stone-400 transition-all hover:bg-white/[0.06] hover:text-stone-200 active:scale-90"
                >
                  ⇄
                </button>
                <label className="min-w-0 flex-1 text-xs text-stone-400">
                  Tinggi ({unit})
                  <input
                    type="number"
                    inputMode="decimal"
                    min={0}
                    value={heightStr}
                    onChange={(e) => editDim(setHeightStr, setHPx)(e.target.value)}
                    className={`mt-1.5 ${inputCls}`}
                  />
                </label>
              </div>

              <p
                className={`mt-3 text-xs ${
                  customValid || customPx === null
                    ? "text-stone-500"
                    : "text-rose-300"
                }`}
              >
                {customPx === null
                  ? "Masukkan angka untuk lebar dan tinggi."
                  : customValid
                    ? unit === "cm"
                      ? `= ${customPx.width} × ${customPx.height} px pada ${PRINT_DPI} DPI (aman cetak).`
                      : `Kanvas ${customPx.width} × ${customPx.height} px.`
                    : `Ukuran harus ${MIN_ARTBOARD_PX}–${MAX_ARTBOARD_PX.toLocaleString("id-ID")} px per sisi${unit === "cm" ? ` (${pxToCm(MAX_ARTBOARD_PX)} cm maks)` : ""}.`}
              </p>

              <button
                type="button"
                disabled={!customValid}
                onClick={() =>
                  customPx && apply(customPx.width, customPx.height)
                }
                className="mt-5 w-full rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-teal-950 transition-all hover:opacity-90 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-35"
              >
                Buat Kanvas Baru
              </button>
            </div>
          ) : (
            <ul className="grid animate-fade-in grid-cols-1 gap-2 sm:grid-cols-2">
              {activeCategory?.presets.map((p) => {
                const [w, h] = orient(p.width, p.height);
                return (
                  <li key={p.id}>
                    <button
                      type="button"
                      onClick={() => apply(w, h)}
                      className="group flex w-full items-start gap-3 rounded-xl border border-glass-border bg-glass-soft p-3 text-left transition-all hover:border-accent/40 hover:bg-white/[0.08] active:scale-[0.99]"
                    >
                      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-white/[0.06] text-stone-300 transition-colors group-hover:bg-accent-soft group-hover:text-accent">
                        {PRESET_ICONS[p.icon]}
                      </span>
                      <span className="min-w-0">
                        <span className="block text-[10px] font-semibold uppercase tracking-wider text-stone-500">
                          {p.group}
                        </span>
                        <span className="block truncate text-sm font-medium text-ink">
                          {p.name}
                        </span>
                        <span className="mt-0.5 block text-xs tabular-nums text-stone-400">
                          {w.toLocaleString("id-ID")} ×{" "}
                          {h.toLocaleString("id-ID")} px
                          {p.note ? ` · ${p.note}` : ""}
                        </span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}

function RailTab({
  active,
  icon,
  label,
  onClick,
}: {
  active: boolean;
  icon: PresetIconKey;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={`flex items-center gap-2.5 rounded-xl px-2.5 py-2 text-left text-[13px] transition-colors ${
        active
          ? "bg-accent-soft font-medium text-accent"
          : "text-stone-400 hover:bg-white/[0.06] hover:text-stone-200"
      }`}
    >
      <span className="shrink-0">{PRESET_ICONS[icon]}</span>
      <span className="truncate">{label}</span>
    </button>
  );
}
