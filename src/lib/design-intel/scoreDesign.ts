import type { ArtboardState, CanvasObject } from "@/types/canvas";

/**
 * AI Design Intelligence — penilai desain BERBASIS ATURAN, sinkron, murni
 * (pola aestheticMatch.ts: heuristik sederhana, tanpa panggilan AI/jaringan,
 * O(n), jauh di bawah 1ms untuk ratusan objek). READ-ONLY terhadap store.
 *
 * Tiga skor 0-100:
 * - Attention  : kontras figur-vs-latar + titik fokus + kepadatan.
 * - Conversion : ada CTA (blok Tombol), label persuasif, kontras tombol,
 *                blok Input, panjang teks yang wajar.
 * - Brand      : keharmonisan hue (makin sedikit keluarga warna makin
 *                kohesif) + bonus kedekatan dengan aksen tema aktif.
 */

export interface DesignScore {
  score: number;
  tips: string[];
}

export interface DesignIntelResult {
  attention: DesignScore;
  conversion: DesignScore;
  brand: DesignScore;
  overall: number;
}

const CTA_KEYWORDS =
  /beli|daftar|mulai|coba|order|hubungi|promo|diskon|download|gabung|pesan/i;

// ------------------------------------------------------------ util warna

function hexToRgb(hex: string): [number, number, number] | null {
  const m = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return null;
  let h = m[1];
  if (h.length === 3) h = h.split("").map((c) => c + c).join("");
  const n = Number.parseInt(h, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

/** Luminansi relatif WCAG (0..1). */
function luminance([r, g, b]: [number, number, number]): number {
  const f = (v: number): number => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
}

/** Rasio kontras WCAG (1..21). */
function contrastRatio(a: [number, number, number], b: [number, number, number]): number {
  const la = luminance(a);
  const lb = luminance(b);
  const [hi, lo] = la > lb ? [la, lb] : [lb, la];
  return (hi + 0.05) / (lo + 0.05);
}

/** Hue (0-360) + saturasi (0-1) untuk binning keluarga warna. */
function hueSat([r, g, b]: [number, number, number]): { hue: number; sat: number } {
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const d = max - min;
  const sat = max === 0 ? 0 : d / max;
  let hue = 0;
  if (d !== 0) {
    if (max === rn) hue = ((gn - bn) / d) % 6;
    else if (max === gn) hue = (bn - rn) / d + 2;
    else hue = (rn - gn) / d + 4;
    hue *= 60;
    if (hue < 0) hue += 360;
  }
  return { hue, sat };
}

function rgbDistance(a: [number, number, number], b: [number, number, number]): number {
  return Math.sqrt((a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2 + (a[2] - b[2]) ** 2);
}

const clamp01to100 = (n: number): number => Math.max(0, Math.min(100, Math.round(n)));

// ---------------------------------------------------------------- input

interface BlockInfo {
  kind: string;
  label: string;
  bg: [number, number, number] | null;
  fg: [number, number, number] | null;
  areaRatio: number; // luas relatif terhadap artboard (0 bila tanpa artboard)
}

function collect(
  objects: ReadonlyMap<string, CanvasObject>,
  artboard: ArtboardState | null,
): { blocks: BlockInfo[]; totalObjects: number; artboardBg: [number, number, number] } {
  const artboardBg = hexToRgb(artboard?.backgroundColor ?? "#ffffff") ?? [255, 255, 255];
  const artboardArea = artboard ? artboard.width * artboard.height : 0;
  const blocks: BlockInfo[] = [];
  let totalObjects = 0;

  for (const o of objects.values()) {
    totalObjects++;
    if (o.type !== "html-block") continue;
    const styles = (o.data.styles ?? {}) as Record<string, string>;
    blocks.push({
      kind: String(o.data.kind ?? "container"),
      label: typeof o.data.label === "string" ? o.data.label : "",
      bg: styles.backgroundColor ? hexToRgb(styles.backgroundColor) : null,
      fg: styles.color ? hexToRgb(styles.color) : null,
      areaRatio: artboardArea > 0 ? (o.width * o.height) / artboardArea : 0,
    });
  }
  return { blocks, totalObjects, artboardBg };
}

// --------------------------------------------------------------- skorer

function scoreAttention(
  blocks: BlockInfo[],
  totalObjects: number,
  artboardBg: [number, number, number],
): DesignScore {
  if (totalObjects === 0) {
    return { score: 0, tips: ["Kanvas masih kosong — mulai dengan satu elemen fokus."] };
  }
  const tips: string[] = [];
  let score = 35;

  let maxContrast = 1;
  for (const b of blocks) {
    if (b.bg) maxContrast = Math.max(maxContrast, contrastRatio(b.bg, artboardBg));
    if (b.fg) maxContrast = Math.max(maxContrast, contrastRatio(b.fg, artboardBg));
  }
  score += Math.min(30, (maxContrast - 1) * 6);
  if (maxContrast < 2.5) {
    tips.push("Kontras elemen vs latar masih rendah — pertegas warna elemen utama.");
  }

  const focal = blocks.filter((b) => b.areaRatio > 0.15);
  if (focal.length >= 1 && focal.length <= 2) score += 15;
  else if (totalObjects > 0) {
    score += 5;
    if (focal.length === 0 && blocks.length > 0) {
      tips.push("Belum ada titik fokus — besarkan satu elemen utama (>15% kanvas).");
    }
  }

  if (totalObjects > 12) {
    score -= Math.min(20, (totalObjects - 12) * 2);
    tips.push("Kanvas mulai padat — kurangi elemen agar perhatian tidak terpecah.");
  }

  return { score: clamp01to100(score), tips };
}

function scoreConversion(blocks: BlockInfo[], artboardBg: [number, number, number]): DesignScore {
  if (blocks.length === 0) {
    return {
      score: 0,
      tips: ["Belum ada blok interaktif — tambahkan blok Tombol sebagai CTA."],
    };
  }
  const tips: string[] = [];
  let score = 25;

  const buttons = blocks.filter((b) => b.kind === "button");
  if (buttons.length > 0) {
    score += 30;
    if (buttons.some((b) => CTA_KEYWORDS.test(b.label))) score += 10;
    else tips.push('Gunakan kata ajakan di tombol (mis. "Beli", "Daftar", "Coba").');
    if (buttons.some((b) => b.bg && contrastRatio(b.bg, artboardBg) >= 3)) score += 15;
    else tips.push("Warna tombol kurang menonjol dari latar — naikkan kontrasnya.");
  } else {
    tips.push("Belum ada tombol CTA — tambahkan blok Tombol.");
  }

  if (blocks.some((b) => b.kind === "input")) score += 10;

  const textLen = blocks.reduce((n, b) => n + b.label.length, 0);
  if (textLen >= 10 && textLen <= 220) score += 10;
  else if (textLen > 220) tips.push("Teks cukup panjang — ringkas pesan utamanya.");

  return { score: clamp01to100(score), tips };
}

function scoreBrand(
  blocks: BlockInfo[],
  artboardBg: [number, number, number],
  themeAccent: [number, number, number] | null,
): DesignScore {
  const tips: string[] = [];
  const colors: [number, number, number][] = [artboardBg];
  for (const b of blocks) {
    if (b.bg) colors.push(b.bg);
    if (b.fg) colors.push(b.fg);
  }

  const bins = new Set<number>();
  for (const c of colors) {
    const { hue, sat } = hueSat(c);
    if (sat < 0.12) continue; // netral/abu tidak dihitung keluarga warna
    bins.add(Math.floor(hue / 30));
  }

  let score = 100 - Math.min(60, bins.size * 8);
  if (bins.size > 4) {
    tips.push("Terlalu banyak keluarga warna — batasi ke 2-3 agar kohesif.");
  }
  if (themeAccent && colors.some((c) => rgbDistance(c, themeAccent) < 80)) {
    score += 15;
  }

  return { score: clamp01to100(score), tips };
}

// ----------------------------------------------------------------- api

export function scoreDesign(
  objects: ReadonlyMap<string, CanvasObject>,
  artboard: ArtboardState | null,
  themeAccentHex: string | null,
): DesignIntelResult {
  const { blocks, totalObjects, artboardBg } = collect(objects, artboard);
  const accent = themeAccentHex ? hexToRgb(themeAccentHex) : null;

  const attention = scoreAttention(blocks, totalObjects, artboardBg);
  const conversion = scoreConversion(blocks, artboardBg);
  const brand = scoreBrand(blocks, artboardBg, accent);

  const overall = Math.round(
    0.4 * attention.score + 0.35 * conversion.score + 0.25 * brand.score,
  );

  return { attention, conversion, brand, overall };
}
