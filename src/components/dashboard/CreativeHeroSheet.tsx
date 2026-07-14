"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useMotionValue, animate, type PanInfo } from "framer-motion";
import { useComfort } from "@/lib/comfort/comfortStore";
import {
  useHeroSheetState,
  setHeroSheetState,
  type HeroSheetState,
} from "@/lib/dashboard/heroSheetStore";
import { CreativeHeroIntro, CreativeHeroActions } from "./CreativeHero";

/**
 * CreativeHeroSheet — pengganti CreativeHero di mobile (`sm:hidden`,
 * CreativeHero sendiri jadi `hidden sm:block`): sheet kaca yang bisa diseret
 * lewat 3 titik tumpu (Collapsed 64px / Compact 40vh / Expanded 85vh),
 * mengambang tepat di atas MobileBottomNav (bukan menimpanya).
 *
 * Tinggi asli dianimasikan langsung (bukan murni translateY seperti PRD
 * minta harfiah) karena tiap status menampilkan KONTEN BERBEDA (bukan
 * sekadar mengintip lebih banyak dari panel yang sama) — trik "kotak tinggi
 * tetap + clip translateY" tidak bisa menghasilkan itu dengan benar. Karena
 * konten di sini kecil (headline+input+3 tombol, bukan daftar panjang),
 * biaya reflow per frame saat diseret dapat diabaikan; motion value tetap
 * dipakai (bukan setState React) supaya penulisan ke DOM tetap efisien.
 */

const COLLAPSED_PX = 64;
const VELOCITY_THRESHOLD = 500; // px/s
const ORDER: HeroSheetState[] = ["collapsed", "compact", "expanded"];

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}

export function CreativeHeroSheet({ onOpenAi }: { onOpenAi: () => void }) {
  const comfort = useComfort();
  const skipMotion = comfort.reduceMotion || comfort.performanceMode;
  const persisted = useHeroSheetState();

  const [vh, setVh] = useState(0);
  const heightMV = useMotionValue(COLLAPSED_PX);
  const didMountRef = useRef(false);
  const stateRef = useRef(persisted);
  stateRef.current = persisted;

  const pxFor = (s: HeroSheetState): number => {
    if (s === "collapsed") return COLLAPSED_PX;
    if (s === "compact") return 0.4 * vh;
    return 0.85 * vh;
  };

  // Ukur viewport — visualViewport dipakai (bukan window.innerHeight saja)
  // supaya target "expanded" ikut menyusut saat keyboard virtual terbuka.
  useEffect(() => {
    const measure = (): void =>
      setVh(window.visualViewport?.height ?? window.innerHeight);
    measure();
    window.addEventListener("resize", measure);
    window.visualViewport?.addEventListener("resize", measure);
    window.visualViewport?.addEventListener("scroll", measure);
    return () => {
      window.removeEventListener("resize", measure);
      window.visualViewport?.removeEventListener("resize", measure);
      window.visualViewport?.removeEventListener("scroll", measure);
    };
  }, []);

  // Selaraskan tinggi ke status tersimpan setiap kali status ATAU vh
  // berubah (termasuk saat keyboard membuka/menutup) — pertama kali tanpa
  // animasi (hindari kedipan "terbuka" tiap reload), setelahnya animasi.
  useEffect(() => {
    if (vh === 0) return;
    const target = pxFor(persisted);
    if (!didMountRef.current) {
      heightMV.set(target);
      didMountRef.current = true;
      return;
    }
    if (skipMotion) {
      heightMV.set(target);
    } else {
      animate(heightMV, target, { type: "spring", stiffness: 380, damping: 38 });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [persisted, vh, skipMotion]);

  const handlePan = (_e: unknown, info: PanInfo): void => {
    const next = clamp(heightMV.get() - info.delta.y, COLLAPSED_PX, 0.85 * vh);
    heightMV.set(next);
  };

  const handlePanEnd = (_e: unknown, info: PanInfo): void => {
    const currentIndex = ORDER.indexOf(stateRef.current);
    const currentPx = heightMV.get();
    let target: HeroSheetState;

    if (Math.abs(info.velocity.y) > VELOCITY_THRESHOLD) {
      // Sentakan cepat langsung lompat ke titik berikutnya, terlepas dari
      // aturan ambang 20% jarak — sesuai perilaku bottom-sheet standar.
      const dir = info.velocity.y < 0 ? 1 : -1;
      target = ORDER[clamp(currentIndex + dir, 0, ORDER.length - 1)];
    } else {
      let best: HeroSheetState = ORDER[0];
      let bestDist = Infinity;
      for (const s of ORDER) {
        const d = Math.abs(pxFor(s) - currentPx);
        if (d < bestDist) {
          bestDist = d;
          best = s;
        }
      }
      target = best;
    }

    setHeroSheetState(target);
    animate(
      heightMV,
      pxFor(target),
      skipMotion
        ? { duration: 0 }
        : { type: "spring", stiffness: 380, damping: 38, velocity: -info.velocity.y },
    );
  };

  const cycle = (): void => {
    const idx = ORDER.indexOf(persisted);
    setHeroSheetState(ORDER[(idx + 1) % ORDER.length]);
  };

  return (
    <div
      className="fixed inset-x-3 z-[45] sm:hidden"
      style={{ bottom: "calc(3.5rem + var(--kv-safe-b) + 12px)" }}
    >
      <motion.div
        style={{ height: heightMV, borderRadius: "24px 24px 16px 16px" }}
        className="kv-lux-ring flex flex-col overflow-hidden border border-glass-border bg-glass shadow-float backdrop-blur-md"
      >
        {skipMotion ? (
          <button
            type="button"
            onClick={cycle}
            aria-label="Ubah ukuran panel Studio Desain"
            className="flex h-9 shrink-0 items-center justify-center"
          >
            <span aria-hidden className="h-1 w-10 rounded-full bg-ink-subtle/40" />
          </button>
        ) : (
          <motion.div
            onPan={handlePan}
            onPanEnd={handlePanEnd}
            style={{ touchAction: "none" }}
            className="flex h-9 shrink-0 cursor-grab items-center justify-center active:cursor-grabbing"
            aria-label="Seret untuk ubah ukuran panel Studio Desain"
            role="button"
            tabIndex={0}
          >
            <span aria-hidden className="h-1 w-10 rounded-full bg-ink-subtle/40" />
          </motion.div>
        )}

        {persisted === "collapsed" ? (
          <button
            type="button"
            onClick={() => setHeroSheetState("compact")}
            className="flex flex-1 items-center justify-center gap-2 px-5 pb-3 text-xs font-semibold text-accent"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path
                d="M12 3L13.8 8.2L19 10L13.8 11.8L12 17L10.2 11.8L5 10L10.2 8.2L12 3Z"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinejoin="round"
              />
            </svg>
            Studio Desain
          </button>
        ) : (
          <div className="flex flex-1 flex-col justify-end overflow-hidden px-5 pb-4">
            {persisted === "expanded" && <CreativeHeroIntro onOpenAi={onOpenAi} />}
            <CreativeHeroActions onOpenAi={onOpenAi} />
          </div>
        )}
      </motion.div>
    </div>
  );
}
