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
  // Rotasi terakhir + status tekan disimpan di ref (bukan state) supaya
  // pointerdown/pointerup bisa menyusun ulang transform lengkap alih-alih
  // menempel string ke transform yang bisa ditimpa rAF pointermove yang
  // masih tertunda (race) atau menumpuk fragmen usang.
  const rot = useRef({ x: 0, y: 0 });
  const pressed = useRef(false);

  const isDisabled = (): boolean => {
    const c = getComfort();
    return (
      c.reduceMotion ||
      c.performanceMode ||
      window.matchMedia("(pointer: coarse)").matches
    );
  };

  const composeTransform = (): string =>
    `perspective(800px) rotateX(${rot.current.x.toFixed(2)}deg) rotateY(${rot.current.y.toFixed(2)}deg)${pressed.current ? " scale(0.985)" : ""}`;

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
    rot.current = { x: (0.5 - py) * maxTilt * 2, y: (px - 0.5) * maxTilt * 2 };
    cancelAnimationFrame(raf.current);
    raf.current = requestAnimationFrame(() => {
      el.style.transform = composeTransform();
      el.style.setProperty("--tilt-mx", `${(px * 100).toFixed(1)}%`);
      el.style.setProperty("--tilt-my", `${(py * 100).toFixed(1)}%`);
      el.style.setProperty("--tilt-glow", "1");
    });
  };

  const onPointerLeave = (): void => {
    const el = ref.current;
    if (!el) return;
    cancelAnimationFrame(raf.current);
    pressed.current = false;
    rot.current = { x: 0, y: 0 };
    el.style.transform = "";
    el.style.setProperty("--tilt-glow", "0");
    el.style.willChange = "";
  };

  const onPointerDown = (): void => {
    const el = ref.current;
    if (!el || isDisabled()) return;
    pressed.current = true;
    el.style.transform = composeTransform(); // depth saat ditekan, tetap tilt
  };

  const onPointerUp = (): void => {
    const el = ref.current;
    if (!el || isDisabled()) return;
    pressed.current = false;
    el.style.transform = composeTransform(); // lepas scale, tilt tetap aktif
  };

  return (
    <div
      ref={ref}
      onPointerEnter={onPointerEnter}
      onPointerMove={onPointerMove}
      onPointerLeave={onPointerLeave}
      onPointerDown={onPointerDown}
      onPointerUp={onPointerUp}
      className={`kv-tilt ${className}`}
    >
      {children}
      <span aria-hidden className="kv-tilt-light" />
    </div>
  );
}
