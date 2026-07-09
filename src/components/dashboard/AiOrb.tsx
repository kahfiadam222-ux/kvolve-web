"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

/**
 * AiOrb — Floating crystal AI creative assistant.
 *
 * A breathing crystal sphere that lives in the bottom-right corner.
 * Click it to open a glass command panel with AI action suggestions.
 * Visual placeholder only — no real AI calls in this version.
 */

const AI_COMMANDS = [
  { id: "generate", label: "Generate desain", icon: "✦", desc: "Buat desain dari deskripsi teks" },
  { id: "improve", label: "Improve desain", icon: "⟳", desc: "Tingkatkan desain yang ada" },
  { id: "idea", label: "Beri ide kreatif", icon: "◈", desc: "Inspirasi konsep visual" },
  { id: "style", label: "Ubah gaya", icon: "◉", desc: "Terapkan gaya visual berbeda" },
];

interface AiOrbProps {
  /** Kontrol eksternal (mis. dipicu dari kartu "AI Creator" di dashboard). */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function AiOrb({ open: controlledOpen, onOpenChange }: AiOrbProps = {}) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false);
  const open = controlledOpen ?? uncontrolledOpen;
  const setOpen = (v: boolean): void => {
    onOpenChange?.(v);
    if (controlledOpen === undefined) setUncontrolledOpen(v);
  };
  const [inputVal, setInputVal] = useState("");

  return (
    <>
      {/* Floating Orb Button */}
      <div className="fixed bottom-8 right-8 z-40">
        <AnimatePresence>
          {!open && (
            <motion.button
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              type="button"
              onClick={() => setOpen(true)}
              className="group relative flex h-14 w-14 items-center justify-center rounded-full"
              title="Kvovle AI Studio"
              aria-label="Buka Kvovle AI Studio"
            >
              {/* Orb glow rings — warna aksen/sekunder ikut tema aktif */}
              <div className="absolute inset-0 animate-breathe rounded-full opacity-40"
                style={{ background: "radial-gradient(circle, rgb(var(--kv-accent) / 0.5), rgb(var(--kv-mint) / 0.3), transparent 70%)", filter: "blur(8px)" }} />
              <div className="absolute -inset-1 animate-[breathe_3s_ease-in-out_infinite_0.5s] rounded-full opacity-20"
                style={{ background: "radial-gradient(circle, rgb(var(--kv-accent) / 0.4), transparent 70%)", filter: "blur(12px)" }} />

              {/* Crystal sphere */}
              <div className="relative h-14 w-14 overflow-hidden rounded-full shadow-glow transition-transform duration-200 group-hover:scale-110"
                style={{
                  background: "linear-gradient(135deg, rgba(255,255,255,0.9) 0%, rgb(var(--kv-accent-wash) / 0.6) 25%, rgb(var(--kv-accent) / 0.5) 60%, rgb(var(--kv-mint) / 0.7) 100%)",
                  boxShadow: "0 0 0 1px rgba(255,255,255,0.5) inset, 0 0 24px rgb(var(--kv-accent) / 0.3), 0 8px 32px rgba(0,0,0,0.12)",
                }}>
                {/* Inner crystal shine */}
                <div className="absolute left-2 top-1.5 h-5 w-5 rounded-full bg-white/60 blur-[6px]" />
                <div className="absolute bottom-2 right-2 h-3 w-3 rounded-full bg-white/30 blur-[4px]" />

                {/* AI icon */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden className="drop-shadow-sm">
                    <path d="M12 3L13.8 8.2L19 10L13.8 11.8L12 17L10.2 11.8L5 10L10.2 8.2L12 3Z" stroke="white" strokeWidth="1.5" strokeLinejoin="round" fill="rgba(255,255,255,0.5)" />
                    <path d="M19 15L19.9 17.1L22 18L19.9 18.9L19 21L18.1 18.9L16 18L18.1 17.1L19 15Z" stroke="white" strokeWidth="1.2" strokeLinejoin="round" fill="rgba(255,255,255,0.4)" />
                    <path d="M6 4L6.5 5.5L8 6L6.5 6.5L6 8L5.5 6.5L4 6L5.5 5.5L6 4Z" stroke="white" strokeWidth="1" strokeLinejoin="round" fill="rgba(255,255,255,0.4)" />
                  </svg>
                </div>
              </div>
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      {/* AI Panel */}
      <AnimatePresence>
        {open && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40"
              onClick={() => setOpen(false)}
            />

            {/* Glass Panel */}
            <motion.div
              initial={{ opacity: 0, y: 24, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 16, scale: 0.97 }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              className="fixed bottom-8 right-8 z-50 w-80 overflow-hidden rounded-3xl"
              style={{
                background: "rgb(var(--kv-glass-rgb) / var(--kv-glass-strong-a))",
                backdropFilter: "blur(calc(40px * var(--kv-blur-scale) * var(--kv-perf-scale))) saturate(2)",
                WebkitBackdropFilter: "blur(calc(40px * var(--kv-blur-scale) * var(--kv-perf-scale))) saturate(2)",
                border: "1px solid rgb(var(--kv-glass-border-rgb) / 0.85)",
                boxShadow: "0 1px 0 rgba(255,255,255,var(--kv-inset-a)) inset, 0 8px 32px rgba(0,0,0,0.12), 0 32px 64px rgba(0,0,0,0.10), 0 0 0 1px rgb(var(--kv-accent) / 0.08)",
              }}
            >
              {/* Header */}
              <div className="flex items-center justify-between border-b border-glass-border-subtle px-5 py-4">
                <div className="flex items-center gap-3">
                  {/* Mini orb */}
                  <div className="h-8 w-8 overflow-hidden rounded-full"
                    style={{
                      background: "linear-gradient(135deg, rgba(255,255,255,0.9), rgb(var(--kv-accent-wash) / 0.6) 30%, rgb(var(--kv-accent) / 0.6) 70%, rgb(var(--kv-mint) / 0.8))",
                      boxShadow: "0 0 12px rgb(var(--kv-accent) / 0.25), 0 1px 0 rgba(255,255,255,0.5) inset",
                    }}
                  >
                    <div className="absolute left-1 top-0.5 h-3 w-3 rounded-full bg-white/50 blur-[4px]" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-ink">Kvovle AI</p>
                    <p className="text-[10px] text-ink-muted">Crystal Creative Studio</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="flex h-7 w-7 items-center justify-center rounded-full bg-canvas-soft/80 text-xs text-ink-muted transition-colors hover:bg-canvas-soft"
                  aria-label="Tutup AI Studio"
                >
                  ×
                </button>
              </div>

              {/* Input */}
              <div className="px-5 py-4">
                <div className="relative">
                  <input
                    type="text"
                    value={inputVal}
                    onChange={(e) => setInputVal(e.target.value)}
                    placeholder="Apa yang ingin kamu buat?"
                    className="w-full rounded-xl border border-glass-border-subtle bg-[rgb(var(--kv-glass-rgb)/0.6)] px-4 py-2.5 text-sm text-ink placeholder:text-ink-subtle outline-none backdrop-blur-sm transition-all focus:border-accent/40 focus:bg-[rgb(var(--kv-glass-rgb)/0.8)] focus:ring-2 focus:ring-accent/10"
                  />
                  <button
                    type="button"
                    className="absolute right-2 top-1/2 -translate-y-1/2 flex h-7 w-7 items-center justify-center rounded-lg bg-accent text-cta-ink shadow-glow transition-all hover:bg-accent-light active:scale-95 disabled:opacity-40"
                    disabled={!inputVal.trim()}
                    aria-label="Kirim"
                  >
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden>
                      <path d="M2 6h8M6 2l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Command suggestions */}
              <div className="border-t border-glass-border-subtle px-3 py-3">
                <p className="mb-2 px-2 text-[10px] font-semibold uppercase tracking-wider text-ink-subtle">
                  Aksi Cepat
                </p>
                <div className="flex flex-col gap-0.5">
                  {AI_COMMANDS.map((cmd) => (
                    <button
                      key={cmd.id}
                      type="button"
                      className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-all hover:bg-accent/6 hover:shadow-sm"
                    >
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent-soft text-sm font-bold text-accent">
                        {cmd.icon}
                      </span>
                      <span>
                        <span className="block text-xs font-semibold text-ink">{cmd.label}</span>
                        <span className="block text-[10px] text-ink-muted">{cmd.desc}</span>
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Footer */}
              <div className="border-t border-glass-border-subtle px-5 py-3">
                <p className="text-center text-[10px] text-ink-subtle">
                  AI Crystal Studio · Kvovle
                </p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
