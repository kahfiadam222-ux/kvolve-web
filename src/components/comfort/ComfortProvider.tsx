"use client";

import { useEffect } from "react";
import { MotionConfig } from "framer-motion";
import { useComfort } from "@/lib/comfort/comfortStore";

/**
 * ComfortProvider — membungkus pohon aplikasi dengan dua jembatan comfort:
 *
 * 1. Atribut `data-comfort` (token dipisah spasi) di <html> — dikonsumsi
 *    aturan CSS di globals.css (blur turun di performance, blob dijeda di
 *    focus, [data-kv-decorative] disembunyikan di simple, animasi CSS mati
 *    di reduce-motion).
 * 2. <MotionConfig reducedMotion> — mematikan animasi framer-motion, yang
 *    TIDAK terjangkau aturan CSS media/attribute apa pun.
 *
 * Children tetap server-rendered menembus boundary client ini (pola
 * children-passthrough); MotionConfig hanya context, tanpa DOM.
 */
export function ComfortProvider({ children }: { children: React.ReactNode }) {
  const comfort = useComfort();

  useEffect(() => {
    const tokens: string[] = [];
    if (comfort.reduceMotion) tokens.push("reduce-motion");
    if (comfort.focusMode) tokens.push("focus");
    if (comfort.simpleMode) tokens.push("simple");
    if (comfort.performanceMode) tokens.push("performance");

    const el = document.documentElement;
    if (tokens.length > 0) el.dataset.comfort = tokens.join(" ");
    else delete el.dataset.comfort;
  }, [comfort]);

  return (
    <MotionConfig
      reducedMotion={
        comfort.reduceMotion || comfort.performanceMode ? "always" : "user"
      }
    >
      {children}
    </MotionConfig>
  );
}
