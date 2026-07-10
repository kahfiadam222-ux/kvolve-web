"use client";

import { Children, useEffect, useRef } from "react";
import { getComfort } from "@/lib/comfort/comfortStore";

/**
 * SpatialCarousel — deret slide 3D ala Apple Vision Pro: kartu di pusat
 * tampil frontal, kartu di sisi menekuk menjauh (rotateY) sambil mengecil
 * dan meredup, dengan scroll-snap sebagai mekanik geser (swipe native di
 * layar sentuh, drag/scroll di desktop).
 *
 * Aturan performa (60fps):
 * - Semua efek = transform/opacity murni, dihitung di rAF yang di-throttle
 *   dari event scroll — nol state React di jalur panas.
 * - `will-change: transform` di kerangka .kv-carousel (globals.css).
 * - Nonaktif total di Kurangi Gerakan / Mode Performa: slide tampil datar
 *   sebagai strip snap biasa (fitur geser tetap ada, tanpa teater 3D).
 */
export function SpatialCarousel({
  children,
  className = "",
  maxRotate = 16,
}: {
  children: React.ReactNode;
  className?: string;
  /** Derajat tekukan maksimum kartu tepi. */
  maxRotate?: number;
}) {
  const trackRef = useRef<HTMLDivElement | null>(null);
  const raf = useRef(0);
  // Hitungan slide, bukan identitas `children` — parent (TemplateCenter)
  // membuat elemen anak baru pada tiap render (mis. saat hover kartu ubah
  // state), yang akan mencopot-lalu-memasang ulang listener scroll/resize
  // dan memanggil apply() secara sinkron di setiap hover jika di-depend
  // langsung ke `children`. Jumlah slide adalah primitif stabil yang hanya
  // benar-benar berubah saat konten carousel berubah.
  const slideCount = Children.count(children);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;

    const apply = (): void => {
      const c = getComfort();
      const flat = c.reduceMotion || c.performanceMode;
      const mid = track.getBoundingClientRect();
      const cx = mid.left + mid.width / 2;
      for (const el of track.children) {
        const s = el as HTMLElement;
        if (flat) {
          s.style.transform = "";
          s.style.opacity = "";
          continue;
        }
        const r = s.getBoundingClientRect();
        const d = (r.left + r.width / 2 - cx) / (mid.width / 2);
        const t = Math.max(-1, Math.min(1, d));
        s.style.transform = `perspective(1200px) rotateY(${(-t * maxRotate).toFixed(2)}deg) scale(${(1 - Math.abs(t) * 0.12).toFixed(3)}) translateZ(0)`;
        s.style.opacity = (1 - Math.abs(t) * 0.3).toFixed(3);
        s.style.zIndex = String(100 - Math.round(Math.abs(t) * 50));
      }
    };

    const onScroll = (): void => {
      cancelAnimationFrame(raf.current);
      raf.current = requestAnimationFrame(apply);
    };

    apply(); // posisi awal
    track.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      cancelAnimationFrame(raf.current);
      track.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [maxRotate, slideCount]);

  return (
    <div ref={trackRef} className={`kv-carousel ${className}`}>
      {children}
    </div>
  );
}
