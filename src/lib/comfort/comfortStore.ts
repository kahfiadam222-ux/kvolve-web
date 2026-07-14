"use client";

import { useSyncExternalStore } from "react";

/**
 * comfortStore — "User Comfort System" (pola localProjects.ts, bukan
 * zustand). Empat mode kenyamanan yang mengendalikan seluruh lapisan
 * dekoratif aplikasi:
 *
 * - reduceMotion   : matikan animasi (CSS via [data-comfort] + framer-motion
 *                    via <MotionConfig> di ComfortProvider — media query
 *                    prefers-reduced-motion TIDAK menjangkau framer-motion,
 *                    makanya perlu toggle in-app).
 * - focusMode      : redakan atmosfer (blob latar dijeda & diredupkan,
 *                    cursor trail mati) — untuk kerja panjang tanpa distraksi.
 * - simpleMode     : sembunyikan section dekoratif ([data-kv-decorative]).
 * - performanceMode: turunkan blur kaca (--kv-blur-scale), matikan noise &
 *                    partikel — untuk perangkat lemah / hemat baterai.
 */

export interface ComfortSettings {
  reduceMotion: boolean;
  focusMode: boolean;
  simpleMode: boolean;
  performanceMode: boolean;
}

const COMFORT_KEY = "kvolve:comfort";

const DEFAULTS: ComfortSettings = {
  reduceMotion: false,
  focusMode: false,
  simpleMode: false,
  performanceMode: false,
};

const hasStorage = (): boolean =>
  typeof window !== "undefined" && !!window.localStorage;

// Snapshot di-cache sebagai referensi stabil — syarat useSyncExternalStore
// (getSnapshot yang mengembalikan objek baru tiap panggilan = loop render).
let cache: ComfortSettings | null = null;

function read(): ComfortSettings {
  if (!hasStorage()) return DEFAULTS;
  try {
    const raw = window.localStorage.getItem(COMFORT_KEY);
    if (!raw) return { ...DEFAULTS };
    const parsed = JSON.parse(raw) as Partial<ComfortSettings>;
    return {
      reduceMotion: parsed.reduceMotion === true,
      focusMode: parsed.focusMode === true,
      simpleMode: parsed.simpleMode === true,
      performanceMode: parsed.performanceMode === true,
    };
  } catch {
    return { ...DEFAULTS };
  }
}

type Listener = () => void;
const listeners = new Set<Listener>();

function emit(): void {
  for (const l of listeners) l();
}

export function getComfort(): ComfortSettings {
  if (cache === null) cache = read();
  return cache;
}

export function setComfort(patch: Partial<ComfortSettings>): void {
  cache = { ...getComfort(), ...patch };
  if (hasStorage()) {
    try {
      window.localStorage.setItem(COMFORT_KEY, JSON.stringify(cache));
    } catch {
      /* kuota penuh/terblokir — tetap berlaku di sesi ini via emit() */
    }
  }
  emit();
}

export function subscribeComfort(cb: Listener): () => void {
  listeners.add(cb);
  const onStorage = (e: StorageEvent): void => {
    if (e.key === COMFORT_KEY) {
      cache = read(); // segarkan dari tab lain
      cb();
    }
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(cb);
    window.removeEventListener("storage", onStorage);
  };
}

/** Hook reaktif — SSR memakai DEFAULTS (referensi stabil, no-op). */
export function useComfort(): ComfortSettings {
  return useSyncExternalStore(subscribeComfort, getComfort, () => DEFAULTS);
}
