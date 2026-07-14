"use client";

import { useSyncExternalStore } from "react";

/**
 * heroSheetStore — posisi terakhir sheet "CreativeHeroSheet" (mobile),
 * pola sama persis dengan comfortStore.ts. Diingat lewat localStorage
 * supaya tidak reset ke "compact" tiap kali halaman dimuat ulang, dan
 * disinkron antar-tab lewat event `storage` bawaan browser.
 */

export type HeroSheetState = "collapsed" | "compact" | "expanded";

const KEY = "kvolve:hero-sheet";
const DEFAULT: HeroSheetState = "compact";
const VALID: readonly HeroSheetState[] = ["collapsed", "compact", "expanded"];

const hasStorage = (): boolean =>
  typeof window !== "undefined" && !!window.localStorage;

// Snapshot di-cache sebagai referensi stabil — syarat useSyncExternalStore.
let cache: HeroSheetState | null = null;

function read(): HeroSheetState {
  if (!hasStorage()) return DEFAULT;
  try {
    const raw = window.localStorage.getItem(KEY);
    return (VALID as string[]).includes(raw ?? "")
      ? (raw as HeroSheetState)
      : DEFAULT;
  } catch {
    return DEFAULT;
  }
}

type Listener = () => void;
const listeners = new Set<Listener>();

function emit(): void {
  for (const l of listeners) l();
}

export function getHeroSheetState(): HeroSheetState {
  if (cache === null) cache = read();
  return cache;
}

export function setHeroSheetState(state: HeroSheetState): void {
  cache = state;
  if (hasStorage()) {
    try {
      window.localStorage.setItem(KEY, state);
    } catch {
      /* kuota penuh/terblokir — tetap berlaku di sesi ini via emit() */
    }
  }
  emit();
}

export function subscribeHeroSheet(cb: Listener): () => void {
  listeners.add(cb);
  const onStorage = (e: StorageEvent): void => {
    if (e.key === KEY) {
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

/** Hook reaktif — SSR memakai DEFAULT (referensi stabil, no-op). */
export function useHeroSheetState(): HeroSheetState {
  return useSyncExternalStore(subscribeHeroSheet, getHeroSheetState, () => DEFAULT);
}
