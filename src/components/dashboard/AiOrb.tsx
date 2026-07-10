"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { createProject } from "@/lib/projects/localProjects";
import { generateTheme } from "@/lib/themes/themeGenerator";
import { setCustomTheme } from "@/lib/themes/themeStore";
import { useComfort } from "@/lib/comfort/comfortStore";

/**
 * AiOrb — Floating crystal AI creative assistant.
 *
 * "AI Assistant Evolution" (PRD): orb bernapas saat idle, membesar halus
 * saat input difokus, lalu mensimulasikan proses (thinking -> generating)
 * sebelum berhenti di kartu hasil yang JUJUR — tidak ada backend AI
 * sungguhan di sini, jadi hasilnya bukan desain palsu, melainkan 3 aksi
 * NYATA yang benar-benar dijalankan (buat kanvas, terapkan tema hasil
 * generateTheme(), buka Template Center).
 */

type Phase = "idle" | "listening" | "thinking" | "generating" | "success";

interface AiCommand {
  id: string;
  label: string;
  icon: string;
  desc: string;
  prompt: string;
}

const AI_COMMANDS: AiCommand[] = [
  { id: "generate", label: "Generate desain", icon: "✦", desc: "Buat desain dari deskripsi teks", prompt: "Poster promo diskon yang menarik" },
  { id: "improve", label: "Improve desain", icon: "⟳", desc: "Tingkatkan desain yang ada", prompt: "Feed Instagram yang lebih estetik" },
  { id: "idea", label: "Beri ide kreatif", icon: "◈", desc: "Inspirasi konsep visual", prompt: "Konsep visual untuk brand kopi lokal" },
  { id: "style", label: "Ubah gaya", icon: "◉", desc: "Terapkan gaya visual berbeda", prompt: "Gaya minimalis dan elegan" },
];

const THINKING_STEPS = [
  "AI menganalisis permintaanmu…",
  "Menyusun ide kreatif…",
  "Merangkai komposisi…",
];

const STEP_DELAY_MS = 1100;
const GENERATING_MS = 1600;

interface AiOrbProps {
  /** Kontrol eksternal (mis. dipicu dari kartu "AI Creator" di dashboard). */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function AiOrb({ open: controlledOpen, onOpenChange }: AiOrbProps = {}) {
  const router = useRouter();
  const comfort = useComfort();
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false);
  const open = controlledOpen ?? uncontrolledOpen;
  const setOpen = (v: boolean): void => {
    onOpenChange?.(v);
    if (controlledOpen === undefined) setUncontrolledOpen(v);
  };

  const [inputVal, setInputVal] = useState("");
  const [phase, setPhase] = useState<Phase>("idle");
  const [stepIndex, setStepIndex] = useState(0);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const skipTheater = comfort.reduceMotion || comfort.performanceMode;

  const clearTimers = (): void => {
    for (const t of timers.current) clearTimeout(t);
    timers.current = [];
  };
  useEffect(() => clearTimers, []);

  const runTheater = (): void => {
    clearTimers();
    setStepIndex(0);
    setPhase("thinking");

    if (skipTheater) {
      setPhase("success"); // hormati Kurangi Gerakan/Performa — langsung ke hasil
      return;
    }

    for (let i = 1; i < THINKING_STEPS.length; i++) {
      timers.current.push(setTimeout(() => setStepIndex(i), STEP_DELAY_MS * i));
    }
    timers.current.push(
      setTimeout(() => setPhase("generating"), STEP_DELAY_MS * THINKING_STEPS.length),
    );
    timers.current.push(
      setTimeout(
        () => setPhase("success"),
        STEP_DELAY_MS * THINKING_STEPS.length + GENERATING_MS,
      ),
    );
  };

  const handleSubmit = (e?: React.FormEvent): void => {
    e?.preventDefault();
    if (!inputVal.trim() || phase !== "idle") return;
    runTheater();
  };

  const handleCommand = (cmd: AiCommand): void => {
    if (phase !== "idle") return;
    setInputVal(cmd.prompt);
    runTheater();
  };

  const resetToIdle = (): void => {
    clearTimers();
    setPhase("idle");
    setInputVal("");
  };

  const close = (): void => {
    clearTimers();
    setPhase("idle");
    setOpen(false);
  };

  const successActions = [
    {
      id: "canvas",
      label: "Buat kanvas Media Sosial",
      onAction: (): void => {
        const project = createProject();
        close();
        router.push(`/canvas/${project.id}?studio=social`);
      },
    },
    {
      id: "theme",
      label: "Terapkan tema yang cocok",
      onAction: (): void => {
        setCustomTheme(generateTheme(inputVal || "Crystal Intelligence"));
      },
    },
    {
      id: "template",
      label: "Buka Template Center",
      onAction: (): void => {
        close();
        document
          .getElementById("template-center")
          ?.scrollIntoView({ behavior: skipTheater ? "auto" : "smooth" });
      },
    },
  ];

  return (
    <>
      {/* Floating Orb Button — offset aman dari home-indicator iOS */}
      <div className="fixed bottom-[calc(1.25rem+var(--kv-safe-b))] right-5 z-40 sm:bottom-8 sm:right-8">
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
              title="Kvolve AI Studio"
              aria-label="Buka Kvolve AI Studio"
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
            {/* Backdrop — redup tipis supaya keadaan modal terbaca di touch */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-ink/10"
              onClick={close}
            />

            {/* Glass Panel — bottom sheet penuh-lebar di ponsel,
                kartu pojok kanan-bawah di desktop */}
            <motion.div
              initial={{ opacity: 0, y: 24, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 16, scale: 0.97 }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              className="fixed inset-x-4 bottom-[calc(1rem+var(--kv-safe-b))] z-50 overflow-hidden rounded-3xl sm:inset-x-auto sm:bottom-8 sm:right-8 sm:w-80"
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
                  {/* Mini orb — cincin berputar saat berpikir/generating */}
                  <div className="relative h-8 w-8 shrink-0">
                    {(phase === "thinking" || phase === "generating") && (
                      <span
                        aria-hidden
                        className="absolute -inset-1 animate-spin rounded-full motion-reduce:animate-none"
                        style={{
                          background: `conic-gradient(from 0deg, rgb(var(--kv-accent)), rgb(var(--kv-mint)), transparent, rgb(var(--kv-accent)))`,
                          WebkitMask: "radial-gradient(farthest-side, transparent calc(100% - 2px), #000 calc(100% - 2px))",
                          mask: "radial-gradient(farthest-side, transparent calc(100% - 2px), #000 calc(100% - 2px))",
                        }}
                      />
                    )}
                    <div className="h-8 w-8 overflow-hidden rounded-full"
                      style={{
                        background: "linear-gradient(135deg, rgba(255,255,255,0.9), rgb(var(--kv-accent-wash) / 0.6) 30%, rgb(var(--kv-accent) / 0.6) 70%, rgb(var(--kv-mint) / 0.8))",
                        boxShadow: "0 0 12px rgb(var(--kv-accent) / 0.25), 0 1px 0 rgba(255,255,255,0.5) inset",
                      }}
                    >
                      <div className="absolute left-1 top-0.5 h-3 w-3 rounded-full bg-white/50 blur-[4px]" />
                    </div>
                  </div>
                  <div>
                    <p className="font-display text-base font-semibold tracking-tight text-ink">
                      Kvolve AI
                    </p>
                    <p className="text-[11px] text-ink-muted">Crystal Creative Studio</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={close}
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-canvas-soft/80 text-sm text-ink-muted transition-colors hover:bg-canvas-soft active:scale-90"
                  aria-label="Tutup AI Studio"
                >
                  ×
                </button>
              </div>

              {phase === "idle" || phase === "listening" ? (
                <>
                  {/* Input */}
                  <form onSubmit={handleSubmit} className="px-5 py-4">
                    <div className="relative">
                      <input
                        type="text"
                        value={inputVal}
                        onChange={(e) => setInputVal(e.target.value)}
                        onFocus={() => setPhase("listening")}
                        onBlur={() => setPhase((p) => (p === "listening" ? "idle" : p))}
                        placeholder="Apa yang ingin kamu buat?"
                        className="w-full rounded-xl border border-glass-border-subtle bg-[rgb(var(--kv-glass-rgb)/0.6)] px-4 py-3 pr-12 text-base text-ink placeholder:text-ink-subtle outline-none backdrop-blur-sm transition-all focus:border-accent/40 focus:bg-[rgb(var(--kv-glass-rgb)/0.8)] focus:ring-2 focus:ring-accent/10 sm:py-2.5 sm:text-sm"
                      />
                      <button
                        type="submit"
                        className="absolute right-1.5 top-1/2 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-lg bg-accent text-cta-ink shadow-glow transition-all hover:bg-accent-light active:scale-95 disabled:opacity-40"
                        disabled={!inputVal.trim()}
                        aria-label="Kirim"
                      >
                        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden>
                          <path d="M2 6h8M6 2l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </button>
                    </div>
                  </form>

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
                          onClick={() => handleCommand(cmd)}
                          className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-all hover:bg-accent/6 hover:shadow-sm"
                        >
                          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent-soft text-sm font-bold text-accent">
                            {cmd.icon}
                          </span>
                          <span>
                            <span className="block text-xs font-semibold text-ink">{cmd.label}</span>
                            <span className="block text-[11px] text-ink-muted">{cmd.desc}</span>
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="border-t border-glass-border-subtle px-5 py-3">
                    <p className="text-center text-[11px] text-ink-subtle">
                      AI Crystal Studio · Kvolve
                    </p>
                  </div>
                </>
              ) : phase === "thinking" || phase === "generating" ? (
                <div className="px-5 py-8 text-center">
                  <AnimatePresence mode="wait">
                    <motion.p
                      key={phase === "generating" ? "generating" : stepIndex}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -6 }}
                      transition={{ duration: 0.2 }}
                      className="text-sm font-medium text-ink"
                    >
                      {phase === "generating" ? "Menyiapkan hasil…" : THINKING_STEPS[stepIndex]}
                    </motion.p>
                  </AnimatePresence>
                  {phase === "generating" && (
                    <div className="bg-shimmer mx-auto mt-4 h-1.5 w-full max-w-[180px] overflow-hidden rounded-full bg-accent-soft" />
                  )}
                </div>
              ) : (
                <div className="px-5 py-6">
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                    className="mb-3 rounded-xl border border-glass-border-subtle bg-accent-soft p-3"
                  >
                    <p className="text-xs font-semibold text-ink">
                      Kvolve AI penuh sedang disiapkan
                    </p>
                    <p className="mt-1 text-[11px] leading-relaxed text-ink-muted">
                      Sementara itu, ini langkah yang bisa langsung kamu ambil:
                    </p>
                  </motion.div>
                  {/* Aksi pertama = CTA utama (terisi); sisanya baris tenang —
                      hierarki primer/sekunder, bukan tiga kartu kembar */}
                  <div className="flex flex-col gap-1.5">
                    {successActions.map((a, i) => (
                      <button
                        key={a.id}
                        type="button"
                        onClick={a.onAction}
                        className={
                          i === 0
                            ? "kv-cta rounded-xl px-3 py-3 text-left text-xs font-semibold shadow-glow transition-all hover:shadow-glow-strong active:scale-[0.98]"
                            : "rounded-xl border border-glass-border-strong bg-glass px-3 py-3 text-left text-xs font-medium text-ink transition-colors hover:border-accent/40 hover:bg-accent-soft hover:text-accent active:scale-[0.98]"
                        }
                      >
                        {a.label}
                      </button>
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={resetToIdle}
                    className="mt-2 w-full py-2.5 text-center text-[11px] font-medium text-ink-subtle transition-colors hover:text-ink-muted"
                  >
                    Coba lagi
                  </button>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
