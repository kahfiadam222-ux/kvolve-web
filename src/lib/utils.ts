export const clamp = (v: number, min: number, max: number) =>
  Math.min(max, Math.max(min, v));

/** Modulo yang selalu positif (untuk offset grid saat panning ke arah negatif). */
export const mod = (a: number, n: number) => ((a % n) + n) % n;

/** Throttle sederhana berbasis waktu — dipakai untuk broadcast posisi kursor. */
export function throttle<T extends (...args: never[]) => void>(
  fn: T,
  ms: number,
): (...args: Parameters<T>) => void {
  let last = 0;
  return (...args) => {
    const now = performance.now();
    if (now - last >= ms) {
      last = now;
      fn(...args);
    }
  };
}

const CURSOR_COLORS = [
  "#0d9488", // teal (aksen Kvolve)
  "#e11d48",
  "#7c3aed",
  "#d97706",
  "#2563eb",
  "#db2777",
];

export const randomCursorColor = () =>
  CURSOR_COLORS[Math.floor(Math.random() * CURSOR_COLORS.length)];
