"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { motion } from "framer-motion";
import {
  CUSTOM_THEME_ID,
  DEFAULT_THEME_ID,
  GLASS_MATERIALS,
  THEME_PRESETS,
  type KvTheme,
} from "@/lib/themes/themeData";
import {
  getActiveThemeId,
  getCustomTheme,
  setActiveTheme,
  setCustomTheme,
  subscribeTheme,
} from "@/lib/themes/themeStore";
import {
  PERSONA_RECOMMENDATIONS,
  generateTheme,
} from "@/lib/themes/themeGenerator";
import { setComfort, useComfort } from "@/lib/comfort/comfortStore";

/**
 * ThemePanel — popover "Personalisasi": tab Tema (preset + persona +
 * AI Theme Generator) dan tab Kenyamanan (4 mode comfort). Tema langsung
 * diterapkan saat diklik (instant apply, tersimpan lintas sesi/tab).
 */

type TabId = "tema" | "nyaman";

const COMFORT_OPTIONS = [
  {
    key: "reduceMotion" as const,
    label: "Kurangi Gerakan",
    desc: "Matikan animasi & transisi di seluruh aplikasi",
  },
  {
    key: "focusMode" as const,
    label: "Mode Fokus",
    desc: "Redakan atmosfer latar & efek kursor",
  },
  {
    key: "simpleMode" as const,
    label: "Mode Simpel",
    desc: "Sembunyikan section dekoratif, sisakan inti",
  },
  {
    key: "performanceMode" as const,
    label: "Mode Performa",
    desc: "Turunkan blur kaca & partikel untuk perangkat lemah",
  },
];

export function ThemePanel({ onClose }: { onClose: () => void }) {
  const [tab, setTab] = useState<TabId>("tema");
  const [prompt, setPrompt] = useState("");
  // Alasan rekomendasi persona terakhir yang disentuh — pengganti tooltip
  // `title` yang tidak pernah muncul di layar sentuh.
  const [personaWhy, setPersonaWhy] = useState<string | null>(null);
  const comfort = useComfort();
  const activeId = useSyncExternalStore(
    subscribeTheme,
    getActiveThemeId,
    () => DEFAULT_THEME_ID,
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent): void => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const themes: KvTheme[] = [...THEME_PRESETS, getCustomTheme()];

  const onGenerate = (): void => {
    if (!prompt.trim()) return;
    setCustomTheme(generateTheme(prompt));
    setPrompt("");
  };

  return (
    <>
      {/* Backdrop tutup-saat-klik — diredupkan di ponsel agar keadaan
          modal terbaca; transparan di desktop (popover biasa) */}
      <div
        className="fixed inset-0 z-40 bg-ink/20 sm:bg-transparent"
        onClick={onClose}
        aria-hidden
      />

      {/* Sheet penuh-lebar di bawah nav pada ponsel (popover w-80 anchor
          kanan akan terpotong tepi kiri di 375px); popover biasa di sm+ */}
      <motion.div
        initial={{ opacity: 0, y: 8, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 6, scale: 0.98 }}
        transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
        className="fixed inset-x-4 top-[4.25rem] z-50 overflow-hidden rounded-2xl border border-glass-border bg-glass-strong shadow-float backdrop-blur-xl sm:absolute sm:inset-x-auto sm:right-0 sm:top-full sm:mt-2 sm:w-80"
        role="dialog"
        aria-label="Personalisasi tampilan"
      >
        {/* Tab header */}
        <div className="flex items-center gap-1 border-b border-glass-border-subtle p-2">
          {(
            [
              ["tema", "Tema"],
              ["nyaman", "Kenyamanan"],
            ] as [TabId, string][]
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id)}
              aria-pressed={tab === id}
              className={`flex-1 rounded-lg px-3 py-2.5 text-xs font-semibold transition-colors sm:py-1.5 ${
                tab === id
                  ? "bg-accent-soft text-accent"
                  : "text-ink-muted hover:bg-black/5 hover:text-ink"
              }`}
            >
              {label}
            </button>
          ))}
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup panel personalisasi"
            className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-sm text-ink-muted transition-colors hover:bg-black/5 hover:text-ink active:scale-90"
          >
            ×
          </button>
        </div>

        {tab === "tema" ? (
          <div className="scrollbar-thin max-h-[min(26rem,calc(100dvh-8rem))] overflow-y-auto p-3">
            {/* Persona — Smart Theme Recommendation */}
            <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-ink-subtle">
              Rekomendasi untukmu
            </p>
            <div className="mb-1.5 flex flex-wrap gap-1.5">
              {PERSONA_RECOMMENDATIONS.map((p) => (
                <button
                  key={p.persona}
                  type="button"
                  title={`${p.why} — menerapkan tema yang cocok`}
                  onClick={() => {
                    setActiveTheme(p.themeId);
                    setPersonaWhy(p.why);
                  }}
                  className="rounded-full border border-glass-border-strong bg-glass px-3 py-1.5 text-[11px] font-medium text-ink-muted transition-colors hover:border-accent/40 hover:bg-accent-soft hover:text-accent active:scale-95"
                >
                  {p.persona}
                </button>
              ))}
            </div>
            {/* Alasan rekomendasi — terlihat juga di layar sentuh */}
            <p className="mb-3 min-h-[1rem] text-[10px] leading-relaxed text-ink-subtle">
              {personaWhy ?? "Ketuk persona untuk tema yang sesuai gayamu."}
            </p>

            {/* Grid preset */}
            <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-ink-subtle">
              Tema
            </p>
            <div className="grid grid-cols-2 gap-2">
              {themes.map((t) => {
                const active = activeId === t.id;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setActiveTheme(t.id)}
                    aria-pressed={active}
                    title={`${t.tagline} · Material ${GLASS_MATERIALS[t.material].label}`}
                    className={`overflow-hidden rounded-xl border text-left transition-all ${
                      active
                        ? "border-accent ring-2 ring-accent/30"
                        : "border-glass-border-strong hover:border-accent/40"
                    }`}
                  >
                    {/* Mini preview: kanvas + kaca + aksen tema tsb */}
                    <div
                      className="relative h-12"
                      style={{ background: `rgb(${t.vars["--kv-canvas"]})` }}
                    >
                      <div
                        className="absolute inset-x-2 bottom-1.5 h-4 rounded-md"
                        style={{
                          background: `rgb(${t.vars["--kv-glass-rgb"]} / ${t.vars["--kv-glass-a"]})`,
                          border: `1px solid rgb(${t.vars["--kv-glass-border-rgb"]} / ${t.vars["--kv-glass-border-a"]})`,
                        }}
                      />
                      <span
                        className="absolute left-2 top-2 h-3 w-3 rounded-full"
                        style={{ background: `rgb(${t.vars["--kv-accent"]})` }}
                      />
                      <span
                        className="absolute left-6 top-2 h-3 w-3 rounded-full"
                        style={{ background: `rgb(${t.vars["--kv-mint"]})` }}
                      />
                    </div>
                    <p className="truncate px-2 pt-1 text-[11px] font-medium text-ink">
                      {t.name}
                    </p>
                    {/* Material kaca — informasi yang dulu tersembunyi di
                        tooltip title, kini terbaca di layar sentuh */}
                    <p className="truncate px-2 pb-1.5 text-[10px] text-ink-subtle">
                      {GLASS_MATERIALS[t.material].label}
                    </p>
                  </button>
                );
              })}
            </div>

            {/* AI Theme Generator */}
            <p className="mb-1.5 mt-5 text-[11px] font-semibold uppercase tracking-wide text-ink-subtle">
              AI Theme Generator
            </p>
            <div className="flex gap-1.5">
              <input
                type="text"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && onGenerate()}
                placeholder="Deskripsikan workspace impianmu..."
                className="min-w-0 flex-1 rounded-lg border border-glass-border-strong bg-glass px-3 py-2.5 text-base text-ink outline-none transition-all placeholder:text-ink-subtle focus:border-accent/50 focus:ring-2 focus:ring-accent/15 sm:py-1.5 sm:text-xs"
              />
              <button
                type="button"
                onClick={onGenerate}
                disabled={!prompt.trim()}
                className="kv-cta rounded-lg px-3.5 py-2.5 text-xs font-semibold transition-all active:scale-95 disabled:cursor-not-allowed disabled:opacity-40 sm:py-1.5"
              >
                Buat
              </button>
            </div>
            <p className="mt-1.5 text-[10px] leading-relaxed text-ink-subtle">
              Contoh: &quot;workspace mewah emas untuk brand fashion&quot; —
              hasilnya tersimpan di slot Custom AI.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-1 p-3">
            {COMFORT_OPTIONS.map((opt) => {
              const on = comfort[opt.key];
              return (
                <button
                  key={opt.key}
                  type="button"
                  role="switch"
                  aria-checked={on}
                  onClick={() => setComfort({ [opt.key]: !on })}
                  className="flex items-center gap-3 rounded-xl p-3 text-left transition-colors hover:bg-black/5 active:bg-black/5"
                >
                  <span className="min-w-0 flex-1">
                    <span className="block text-xs font-semibold text-ink">
                      {opt.label}
                    </span>
                    <span className="block text-[11px] leading-relaxed text-ink-muted">
                      {opt.desc}
                    </span>
                  </span>
                  <span
                    className={`relative h-5 w-9 shrink-0 rounded-full transition-colors ${
                      on ? "bg-accent" : "bg-ink-subtle/40"
                    }`}
                    aria-hidden
                  >
                    <span
                      className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${
                        on ? "translate-x-[18px]" : "translate-x-0.5"
                      }`}
                    />
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </motion.div>
    </>
  );
}
