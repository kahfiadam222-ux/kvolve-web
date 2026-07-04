"use client";

import { useEffect, useRef } from "react";

/**
 * CursorTrail — pendaran partikel mengikuti kursor + letupan saat klik
 * ("Google Anti-Gravity style"). Berdampingan dengan RippleLayer (riak air
 * di tombol) — dua efek berbeda karakter, tidak saling menggantikan.
 *
 * Kanvas HTML5 murni (bukan Pixi) di lapisan teratas layar, `pointer-events:
 * none` sehingga tidak pernah mencuri klik. State partikel disimpan di ref
 * biasa (bukan React state) supaya loop render tidak memicu re-render React
 * sama sekali — konsisten dengan filosofi performa RippleLayer.
 */

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number; // 0..1, dikurangi tiap frame
  decay: number;
  size: number;
  hue: "trail" | "burst";
}

const TRAIL_COLOR = "255,255,255";
const BURST_COLOR = "147,197,253"; // biru es (#93c5fd) senada palet Crystal

export function CursorTrail() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return; // tanpa listener sama sekali, bukan sekadar tanpa animasi
    }

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const resize = (): void => {
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      canvas.style.width = `${window.innerWidth}px`;
      canvas.style.height = `${window.innerHeight}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener("resize", resize);

    let particles: Particle[] = [];
    let lastX = -1;
    let lastY = -1;
    const SPAWN_DIST = 14; // px jarak minimum sebelum partikel trail baru muncul

    const spawnTrail = (x: number, y: number): void => {
      particles.push({
        x,
        y,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        life: 1,
        decay: 1 / 30, // ~500ms pada 60fps
        size: 1.5 + Math.random() * 1.5,
        hue: "trail",
      });
    };

    const spawnBurst = (x: number, y: number): void => {
      const count = 8 + Math.floor(Math.random() * 3); // 8-10
      for (let i = 0; i < count; i++) {
        const angle = (Math.PI * 2 * i) / count + Math.random() * 0.5;
        const speed = 1.5 + Math.random() * 2.5;
        particles.push({
          x,
          y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          life: 1,
          decay: 1 / 45, // ~750ms
          size: 2.5 + Math.random() * 2,
          hue: "burst",
        });
      }
    };

    const onPointerMove = (e: PointerEvent): void => {
      if (lastX < 0) {
        lastX = e.clientX;
        lastY = e.clientY;
        return;
      }
      const dx = e.clientX - lastX;
      const dy = e.clientY - lastY;
      if (Math.hypot(dx, dy) >= SPAWN_DIST) {
        spawnTrail(e.clientX, e.clientY);
        lastX = e.clientX;
        lastY = e.clientY;
      }
    };

    const onPointerDown = (e: PointerEvent): void => {
      spawnBurst(e.clientX, e.clientY);
    };

    window.addEventListener("pointermove", onPointerMove, { passive: true });
    window.addEventListener("pointerdown", onPointerDown, { passive: true });

    let raf = 0;
    const tick = (): void => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles = particles.filter((p) => p.life > 0);
      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.015; // gravitasi ringan, terutama terlihat pada burst
        p.life -= p.decay;

        const alpha = Math.max(0, p.life) * (p.hue === "burst" ? 0.9 : 0.7);
        const color = p.hue === "burst" ? BURST_COLOR : TRAIL_COLOR;
        ctx.save();
        ctx.shadowBlur = p.hue === "burst" ? 6 : 4;
        ctx.shadowColor = `rgba(${color},${alpha})`;
        ctx.fillStyle = `rgba(${color},${alpha})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * Math.max(0.2, p.life), 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerdown", onPointerDown);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className="pointer-events-none fixed inset-0 z-[9999]"
    />
  );
}
