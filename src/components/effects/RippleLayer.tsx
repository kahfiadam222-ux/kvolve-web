"use client";

import { useEffect } from "react";
import { getComfort } from "@/lib/comfort/comfortStore";

/**
 * RippleLayer — efek riak air global setiap tombol ditekan, mensimulasikan
 * cahaya menyebar di permukaan kaca/air. Dipasang SEKALI di root layout
 * sehingga berlaku di SELURUH aplikasi (shell maupun workspace kanvas).
 *
 * Implementasi murni DOM (bukan state React) agar tidak memicu re-render
 * pada tiap klik: satu listener pointerdown di document (capture), lalu
 * untuk tiap <button>/[role=button] yang ditekan, elemen riak sementara
 * di-append ke lapisan overlay fixed dan dibuang otomatis setelah animasi
 * selesai. `prefers-reduced-motion` sudah ditangani secara global di
 * globals.css (durasi animasi otomatis dipersingkat).
 */
export function RippleLayer() {
  useEffect(() => {
    const root = document.createElement("div");
    root.style.position = "fixed";
    root.style.inset = "0";
    root.style.zIndex = "9999";
    root.style.pointerEvents = "none";
    document.body.appendChild(root);

    const onPointerDown = (e: PointerEvent): void => {
      // Comfort mode dibaca saat klik (murah — objek ter-cache), bukan via
      // subscription: efek riak berikutnya langsung mengikuti setelan baru.
      const comfort = getComfort();
      if (comfort.reduceMotion || comfort.performanceMode) return;

      const target = e.target as HTMLElement | null;
      const btn = target?.closest<HTMLElement>('button, [role="button"]');
      if (
        !btn ||
        btn.hasAttribute("disabled") ||
        btn.getAttribute("aria-disabled") === "true"
      ) {
        return;
      }

      const rect = btn.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;

      // Kontainer kliping mengikuti bentuk tombol (termasuk rounded corner)
      // agar riak terlihat "terkurung" di dalam tombolnya, bukan meluber.
      const clip = document.createElement("div");
      clip.style.position = "fixed";
      clip.style.left = `${rect.left}px`;
      clip.style.top = `${rect.top}px`;
      clip.style.width = `${rect.width}px`;
      clip.style.height = `${rect.height}px`;
      clip.style.borderRadius = getComputedStyle(btn).borderRadius;
      clip.style.overflow = "hidden";
      clip.style.pointerEvents = "none";

      const size = Math.max(rect.width, rect.height) * 2.4;
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const ripple = document.createElement("span");
      ripple.className = "kv-water-ripple";
      ripple.style.left = `${x - size / 2}px`;
      ripple.style.top = `${y - size / 2}px`;
      ripple.style.width = `${size}px`;
      ripple.style.height = `${size}px`;

      clip.appendChild(ripple);
      root.appendChild(clip);

      const cleanup = (): void => clip.remove();
      ripple.addEventListener("animationend", cleanup);
      setTimeout(cleanup, 900); // jaring pengaman bila animationend tak terpicu
    };

    document.addEventListener("pointerdown", onPointerDown, { capture: true });
    return () => {
      document.removeEventListener("pointerdown", onPointerDown, {
        capture: true,
      });
      root.remove();
    };
  }, []);

  return null;
}
