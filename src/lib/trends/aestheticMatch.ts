import type { CanvasObject } from "@/types/canvas";
import { TREND_CATALOG, type TrendItem } from "./trendData";

export interface AestheticMatchResult {
  tags: string[];
  colors: string[];
  matches: TrendItem[];
}

/** Palet -> tag estetika, dicocokkan lewat jarak RGB terdekat (bukan AI). */
const PALETTE_TAGS: { hex: string; tags: string[] }[] = [
  { hex: "#0f172a", tags: ["dark", "editorial"] },
  { hex: "#1e293b", tags: ["dark", "anime"] },
  { hex: "#f472b6", tags: ["vibrant", "y2k", "playful"] },
  { hex: "#93c5fd", tags: ["soft", "clean", "calm"] },
  { hex: "#2dd4bf", tags: ["clean", "fresh", "minimal"] },
  { hex: "#d97706", tags: ["warm", "luxury"] },
  { hex: "#818cf8", tags: ["dreamy", "soft", "y2k"] },
  { hex: "#475569", tags: ["minimal", "editorial"] },
  { hex: "#10b981", tags: ["calm", "fresh"] },
  { hex: "#fb923c", tags: ["warm", "playful"] },
  { hex: "#8b5cf6", tags: ["vibrant", "y2k"] },
  { hex: "#ffffff", tags: ["clean", "minimal"] },
];

/** Kata kunci sederhana dari label/teks kanvas -> tag tambahan. */
const KEYWORD_TAGS: { keywords: string[]; tags: string[] }[] = [
  { keywords: ["sale", "diskon", "promo"], tags: ["vibrant", "playful"] },
  { keywords: ["gelap", "dark", "malam", "night"], tags: ["dark", "editorial"] },
  { keywords: ["minimal", "clean", "simpel"], tags: ["minimal", "clean"] },
  { keywords: ["mewah", "luxury", "premium"], tags: ["luxury", "warm"] },
];

function hexToRgb(hex: string): [number, number, number] | null {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return null;
  const n = Number.parseInt(m[1], 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function nearestTags(hex: string): string[] {
  const rgb = hexToRgb(hex);
  if (!rgb) return [];
  let best: { tags: string[]; dist: number } | null = null;
  for (const p of PALETTE_TAGS) {
    const prgb = hexToRgb(p.hex);
    if (!prgb) continue;
    const dist =
      (rgb[0] - prgb[0]) ** 2 +
      (rgb[1] - prgb[1]) ** 2 +
      (rgb[2] - prgb[2]) ** 2;
    if (!best || dist < best.dist) best = { tags: p.tags, dist };
  }
  return best?.tags ?? [];
}

/**
 * Vibe-Match Radar — ekstrak warna dominan + teks aktif dari kanvas,
 * cocokkan ke tag estetika, lalu saring katalog tren lokal (`trendData.ts`).
 * Sinkron & berbasis aturan (jarak warna + kata kunci), BUKAN panggilan
 * AI/jaringan — sesuai syarat PRD (<100ms), dan cukup cepat untuk puluhan-
 * ratusan objek dalam satu pass O(n).
 */
export function matchAesthetic(
  objects: ReadonlyMap<string, CanvasObject>,
): AestheticMatchResult {
  const colors = new Set<string>();
  const tags = new Set<string>();
  const textParts: string[] = [];

  for (const o of objects.values()) {
    if (o.type === "html-block") {
      const styles = (o.data.styles ?? {}) as Record<string, string>;
      if (styles.backgroundColor) colors.add(styles.backgroundColor);
      if (styles.color) colors.add(styles.color);
      if (typeof o.data.label === "string") textParts.push(o.data.label);
    } else if (o.type === "pdf-page" && typeof o.data.text === "string") {
      textParts.push(o.data.text);
    }
  }

  for (const hex of colors) {
    for (const t of nearestTags(hex)) tags.add(t);
  }

  const textLower = textParts.join(" ").toLowerCase();
  for (const { keywords, tags: kTags } of KEYWORD_TAGS) {
    if (keywords.some((k) => textLower.includes(k))) {
      for (const t of kTags) tags.add(t);
    }
  }

  const tagList = [...tags].slice(0, 3);
  const matches =
    tagList.length === 0
      ? []
      : TREND_CATALOG.filter((item) => item.tags.some((t) => tags.has(t)));

  return { tags: tagList, colors: [...colors], matches };
}
