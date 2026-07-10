"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { useAuthUser } from "@/hooks/useAuthUser";
import { renameGuestUser } from "@/lib/auth/appUser";
import { setComfort, useComfort } from "@/lib/comfort/comfortStore";

/**
 * SettingsPanel — menu Pengaturan aplikasi (sheet di ponsel, popover di
 * desktop; pola posisi sama dengan ThemePanel).
 *
 * Isi: (1) Profil — ganti nickname tampilan (dipakai kursor kolaborasi &
 * avatar) tanpa mengganti identitas; (2) preferensi dasar — dua toggle
 * kenyamanan tersering + penunjuk ke panel Personalisasi untuk tema penuh;
 * (3) data lokal — reset preferensi tampilan dengan konfirmasi dua langkah;
 * (4) tentang aplikasi. Tidak menyentuh proyek/kanvas pengguna sama sekali.
 */

/** Kunci preferensi TAMPILAN yang aman di-reset — TIDAK menyentuh kunci
 *  proyek/objek/artboard/story (karya pengguna). */
const PREF_KEYS = [
  "kvolve:theme",
  "kvolve:theme-custom",
  "kvolve:comfort",
  "kvolve:trending-board-expanded",
  "kvolve:design-intel-expanded",
];

export function SettingsPanel({ onClose }: { onClose: () => void }) {
  const { user } = useAuthUser();
  const comfort = useComfort();
  const [nick, setNick] = useState("");
  const [saved, setSaved] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  const savedTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (user) setNick(user.name);
  }, [user]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent): void => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      if (savedTimer.current) clearTimeout(savedTimer.current);
    };
  }, [onClose]);

  const saveNick = (e?: React.FormEvent): void => {
    e?.preventDefault();
    if (!user?.guest || !nick.trim()) return;
    renameGuestUser(nick);
    setSaved(true);
    if (savedTimer.current) clearTimeout(savedTimer.current);
    savedTimer.current = setTimeout(() => setSaved(false), 2000);
  };

  const resetPrefs = (): void => {
    if (!confirmReset) {
      setConfirmReset(true);
      setTimeout(() => setConfirmReset(false), 3500);
      return;
    }
    try {
      for (const k of PREF_KEYS) window.localStorage.removeItem(k);
    } catch {
      /* storage terblokir — reload tetap mengembalikan default in-memory */
    }
    window.location.reload();
  };

  const sectionLabel =
    "mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-ink-subtle";

  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-ink/20 sm:bg-transparent"
        onClick={onClose}
        aria-hidden
      />

      <motion.div
        initial={{ opacity: 0, y: 8, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 6, scale: 0.98 }}
        transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
        className="kv-lux-ring fixed inset-x-4 top-[4.25rem] z-50 overflow-hidden rounded-2xl border border-glass-border shadow-float sm:absolute sm:inset-x-auto sm:right-0 sm:top-full sm:mt-2 sm:w-80"
        style={{
          // Material sepekat panel AiOrb — teks di belakang tidak menembus.
          background: "rgb(var(--kv-glass-rgb) / 0.9)",
          backdropFilter:
            "blur(calc(40px * var(--kv-blur-scale) * var(--kv-perf-scale))) saturate(2)",
          WebkitBackdropFilter:
            "blur(calc(40px * var(--kv-blur-scale) * var(--kv-perf-scale))) saturate(2)",
        }}
        role="dialog"
        aria-label="Pengaturan aplikasi"
      >
        <div className="flex items-center justify-between border-b border-glass-border-subtle px-4 py-3">
          <h2 className="font-display text-sm font-semibold tracking-tight text-ink">
            Pengaturan
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup pengaturan"
            className="grid h-9 w-9 place-items-center rounded-full text-sm text-ink-muted transition-colors hover:bg-black/5 hover:text-ink active:scale-90"
          >
            ×
          </button>
        </div>

        <div className="scrollbar-thin max-h-[min(26rem,calc(100dvh-9rem))] overflow-y-auto p-4">
          {/* ------------------------------------------------ Profil */}
          <p className={sectionLabel}>Profil</p>
          <div className="flex items-center gap-3">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-gradient-to-br from-accent-light to-accent text-sm font-bold text-cta-ink ring-2 ring-white/40">
              {(nick.trim()[0] ?? "?").toUpperCase()}
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-ink">
                {user ? user.name : "Belum masuk"}
              </p>
              <p className="text-[11px] text-ink-muted">
                {user
                  ? user.guest
                    ? "Sesi tamu · nama dipakai kursor kolaborasi"
                    : user.email ?? "Akun terhubung"
                  : "Masuk dulu lewat halaman login"}
              </p>
            </div>
          </div>

          <form onSubmit={saveNick} className="mt-3">
            <label className="text-xs text-ink-muted" htmlFor="kv-nickname">
              Nickname tampilan
            </label>
            <div className="mt-1.5 flex gap-1.5">
              <input
                id="kv-nickname"
                type="text"
                value={nick}
                onChange={(e) => setNick(e.target.value)}
                maxLength={40}
                disabled={!user?.guest}
                placeholder="mis. Kahfi"
                className="min-w-0 flex-1 rounded-lg border border-glass-border-strong bg-glass px-3 py-2.5 text-base text-ink outline-none transition-all placeholder:text-ink-subtle focus:border-accent/50 focus:ring-2 focus:ring-accent/15 disabled:cursor-not-allowed disabled:opacity-50 sm:py-1.5 sm:text-xs"
              />
              <button
                type="submit"
                disabled={!user?.guest || !nick.trim() || nick.trim() === user?.name}
                className="kv-cta rounded-lg px-3.5 py-2.5 text-xs font-semibold transition-all active:scale-95 disabled:cursor-not-allowed disabled:opacity-40 sm:py-1.5"
              >
                {saved ? "Tersimpan ✓" : "Simpan"}
              </button>
            </div>
            {!user?.guest && user && (
              <p className="mt-1.5 text-[10px] leading-relaxed text-ink-subtle">
                Nama akun terhubung dikelola oleh penyedia login (Google/GitHub).
              </p>
            )}
          </form>

          {/* ------------------------------------------------ Preferensi dasar */}
          <p className={`${sectionLabel} mt-5`}>Preferensi dasar</p>
          {(
            [
              ["reduceMotion", "Kurangi Gerakan", "Matikan animasi & transisi"],
              ["performanceMode", "Mode Performa", "Blur kaca hemat untuk perangkat lemah"],
            ] as const
          ).map(([key, label, desc]) => {
            const on = comfort[key];
            return (
              <button
                key={key}
                type="button"
                role="switch"
                aria-checked={on}
                onClick={() => setComfort({ [key]: !on })}
                className="flex w-full items-center gap-3 rounded-xl p-2.5 text-left transition-colors hover:bg-black/5 active:bg-black/5"
              >
                <span className="min-w-0 flex-1">
                  <span className="block text-xs font-semibold text-ink">{label}</span>
                  <span className="block text-[11px] text-ink-muted">{desc}</span>
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
          <p className="mt-1 px-2.5 text-[10px] leading-relaxed text-ink-subtle">
            Tema lengkap & mode kenyamanan lain ada di tombol palet 🎨 di
            samping tombol ini.
          </p>

          {/* ------------------------------------------------ Data lokal */}
          <p className={`${sectionLabel} mt-5`}>Data lokal</p>
          <button
            type="button"
            onClick={resetPrefs}
            className={`w-full rounded-xl border px-3 py-2.5 text-left text-xs font-medium transition-colors active:scale-[0.99] ${
              confirmReset
                ? "border-rose-400/50 bg-rose-500/10 text-rose-500"
                : "border-glass-border-strong bg-glass text-ink hover:border-accent/40"
            }`}
          >
            {confirmReset
              ? "Ketuk lagi untuk mereset preferensi tampilan"
              : "Reset preferensi tampilan (tema & kenyamanan)"}
          </button>
          <p className="mt-1.5 text-[10px] leading-relaxed text-ink-subtle">
            Hanya preferensi tampilan yang direset — proyek, kanvas, dan story
            kamu TIDAK tersentuh.
          </p>

          {/* ------------------------------------------------ Tentang */}
          <p className={`${sectionLabel} mt-5`}>Tentang</p>
          <div className="rounded-xl border border-glass-border-subtle bg-glass-soft p-3">
            <p className="text-xs font-semibold text-ink">Kvolve · v0.1.0</p>
            <p className="mt-0.5 text-[11px] leading-relaxed text-ink-muted">
              Infinite canvas kolaboratif — desain, PDF, dan layout HTML dalam
              satu ruang kerja. Display type: Plus Jakarta Sans.
            </p>
          </div>
        </div>
      </motion.div>
    </>
  );
}
