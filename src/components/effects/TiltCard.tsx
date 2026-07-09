"use client";

import { useRef } from "react";
import { getComfort } from "@/lib/comfort/comfortStore";

/**
 * TiltCard — fisika kartu "Liquid Intelligence": rotasi 3D halus mengikuti
 * pointer + pantulan cahaya yang mengejar kursor (lihat .kv-tilt-light di
 * globals.css). Dipakai sebagai PEMBUNGKUS di sekeliling kartu dashboard.
 *
 * Aturan performa (60fps):
 * - Tanpa state React di jalur pointermove — hanya ref + style.setProperty,
 *   di-throttle requestAnimationFrame.
 * - `will-change: transform` hanya selama hover (di-set on enter, dibersihkan
 *   on leave) supaya compositor layer tidak menumpuk di grid kartu.
 * - Nonaktif total di reduce-motion/performance mode dan pointer kasar
 *   (layar sentuh) — dicek saat interaksi, bukan via subscription.
 */
export function TiltCard({
  children,
  className = "",
  maxTilt = 4,
}: {
  children: React.ReactNode;
  className?: string;
  maxTilt?: number;
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  const raf = useRef(0);

  const isDisabled = (): boolean => {
    const c = getComfort();
    return (
      c.reduceMotion ||
      c.performanceMode ||
      window.matchMedia("(pointer: coarse)").matches
    );
  };

  const onPointerEnter = (): void => {
    const el = ref.current;
    if (!el || isDisabled()) return;
    el.style.willChange = "transform";
  };

  const onPointerMove = (e: React.PointerEvent): void => {
    const el = ref.current;
    if (!el || isDisabled()) return;
    const rect = el.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width;
    const py = (e.clientY - rect.top) / rect.height;
    cancelAnimationFrame(raf.current);
    raf.current = requestAnimationFrame(() => {
      el.style.transform = `perspective(800px) rotateX(${((0.5 - py) * maxTilt * 2).toFixed(2)}deg) rotateY(${((px - 0.5) * maxTilt * 2).toFixed(2)}deg)`;
      el.style.setProperty("--tilt-mx", `${(px * 100).toFixed(1)}%`);
      el.style.setProperty("--tilt-my", `${(py * 100).toFixed(1)}%`);
      el.style.setProperty("--tilt-glow", "1");
    });
  };

  const onPointerLeave = (): void => {
    const el = ref.current;
    if (!el) return;
    cancelAnimationFrame(raf.current);
    el.style.transform = "";
    el.style.setProperty("--tilt-glow", "0");
    el.style.willChange = "";
  };

  const onPointerDown = (): void => {
    const el = ref.current;
    if (!el || isDisabled()) return;
    el.style.transform += " scale(0.985)"; // depth saat ditekan
  };

  return (
    <div
      ref={ref}
      onPointerEnter={onPointerEnter}
      onPointerMove={onPointerMove}
      onPointerLeave={onPointerLeave}
      onPointerDown={onPointerDown}
      onPointerUp={onPointerLeave}
      className={`kv-tilt ${className}`}
    >
      {children}
      <span aria-hidden className="kv-tilt-light" />
    </div>
  );
}
