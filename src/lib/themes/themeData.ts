/**
 * Liquid Intelligence — katalog tema.
 *
 * Setiap tema adalah peta lengkap variabel CSS `--kv-*` (kontrak di
 * globals.css :root). Preset disimpan SUDAH ter-resolve lewat `buildTheme`
 * pada module load, sehingga konsumen (ThemeProvider, skrip no-flash)
 * tinggal menempel `vars` ke <html> tanpa perhitungan runtime.
 *
 * Aturan penting:
 * - "crystal-intelligence" (id default, kini bernama "Royal Atelier")
 *   nilainya HARUS identik dengan :root globals.css — mengaktifkannya
 *   identik dengan tanpa tema sama sekali. Id lama dipertahankan agar
 *   preferensi tersimpan pengguna tetap valid.
 * - Nama var `--kv-mint` dipertahankan untuk kompatibilitas kelas token
 *   `mint`, meskipun tema lain mengisinya dengan warna sekunder non-mint
 *   (amber, oranye, cyan).
 * - Warna KONTEN (default block, data tren, kursor kolaborasi) tidak pernah
 *   ikut tema — hanya chrome aplikasi yang memakai token ini.
 */

// ------------------------------------------------------------------ util

function hexToRgb(hex: string): [number, number, number] {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return [0, 0, 0];
  const n = Number.parseInt(m[1], 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

/** "#2563EB" -> "37 99 235" (triplet spasi untuk rgb(var(--x) / a)). */
export function tri(hex: string): string {
  const [r, g, b] = hexToRgb(hex);
  return `${r} ${g} ${b}`;
}

/** Campur dua hex; t=0 -> a, t=1 -> b. */
export function mixHex(a: string, b: string, t: number): string {
  const ra = hexToRgb(a);
  const rb = hexToRgb(b);
  const c = ra.map((v, i) => Math.round(v + (rb[i] - v) * t));
  return `#${c.map((v) => v.toString(16).padStart(2, "0")).join("")}`;
}

function rgba(hex: string, a: number): string {
  const [r, g, b] = hexToRgb(hex);
  return `rgba(${r}, ${g}, ${b}, ${a})`;
}

// ------------------------------------------------------------- material

export type GlassMaterialId =
  | "crystal"
  | "liquid"
  | "frost"
  | "diamond"
  | "organic";

interface GlassMaterial {
  label: string;
  blurScale: number;
  glassA: number;
  glassSoftA: number;
  glassStrongA: number;
  borderA: number;
  sheenA: number;
}

/**
 * Pemetaan JUJUR 5 material PRD ke parameter kaca nyata — material bukan
 * shader ajaib, melainkan kombinasi blur/opasitas/border/sheen yang berbeda.
 */
export const GLASS_MATERIALS: Record<GlassMaterialId, GlassMaterial> = {
  crystal: { label: "Pure Crystal", blurScale: 1.0, glassA: 0.55, glassSoftA: 0.35, glassStrongA: 0.72, borderA: 0.7, sheenA: 0.35 },
  liquid:  { label: "Liquid Glass", blurScale: 0.85, glassA: 0.45, glassSoftA: 0.28, glassStrongA: 0.65, borderA: 0.55, sheenA: 0.55 },
  frost:   { label: "Frost Glass",  blurScale: 1.3, glassA: 0.65, glassSoftA: 0.45, glassStrongA: 0.82, borderA: 0.45, sheenA: 0.15 },
  diamond: { label: "Diamond Glass", blurScale: 0.5, glassA: 0.6, glassSoftA: 0.4, glassStrongA: 0.78, borderA: 0.95, sheenA: 0.7 },
  organic: { label: "Organic Glass", blurScale: 0.9, glassA: 0.5, glassSoftA: 0.32, glassStrongA: 0.7, borderA: 0.5, sheenA: 0.25 },
};

// ----------------------------------------------------------------- tema

export interface KvTheme {
  id: string;
  name: string;
  tagline: string;
  dark: boolean;
  material: GlassMaterialId;
  /** Peta lengkap `--kv-*` siap tempel ke <html>. */
  vars: Record<string, string>;
  isCustom?: boolean;
}

export interface ThemeSpec {
  id: string;
  name: string;
  tagline: string;
  dark: boolean;
  material: GlassMaterialId;
  canvas: string;
  canvasSoft: string;
  ink: string;
  inkMuted: string;
  inkSubtle: string;
  inkStrong: string;
  accent: string;
  accentLight: string;
  /** Warna sekunder — mengisi slot token `mint`. */
  secondary: string;
  secondaryLight: string;
  ctaFrom: string;
  ctaTo: string;
  motionScale: number;
  // Opsional — diturunkan otomatis bila kosong:
  ctaFromHover?: string;
  ctaToHover?: string;
  ctaMint?: [string, string, string, string]; // from, to, fromHover, toHover
  ctaInk?: string; // default putih
  accentDeep?: string;
  accentWash?: string;
  washSoft?: string;
  secondaryWash?: string;
  gradMid?: string;
  glassRgbHex?: string;
  glassA?: number;
  glassSoftA?: number;
  glassStrongA?: number;
  glassBorderRgbHex?: string;
  glassBorderA?: number;
  glassBorderStrongHex?: string;
  insetA?: number;
  noiseA?: number;
  blobs?: [string, string, string, string, string, string, string, string, string];
}

/** Turunkan 9 stop blob atmosfer dari keluarga aksen bila tak dioverride. */
function deriveBlobs(spec: ThemeSpec, gradMid: string): string[] {
  const d = spec.dark;
  return [
    rgba(spec.accentLight, d ? 0.14 : 0.55),
    rgba(spec.accent, d ? 0.06 : 0.3),
    rgba(gradMid, d ? 0.1 : 0.3),
    rgba(gradMid, d ? 0.05 : 0.15),
    rgba(spec.secondary, d ? 0.1 : 0.3),
    rgba(spec.secondaryLight, d ? 0.05 : 0.15),
    rgba(spec.accentLight, d ? 0.08 : 0.35),
    rgba(spec.accent, d ? 0.04 : 0.18),
    rgba(mixHex(spec.accentLight, d ? spec.canvas : "#ffffff", 0.5), d ? 0.1 : 0.5),
  ];
}

export function buildTheme(spec: ThemeSpec): KvTheme {
  const m = GLASS_MATERIALS[spec.material];
  const d = spec.dark;
  const toward = d ? spec.canvas : "#ffffff";

  const accentDeep = spec.accentDeep ?? mixHex(spec.accent, "#000000", 0.25);
  const accentWash = spec.accentWash ?? mixHex(spec.accent, toward, d ? 0.72 : 0.85);
  const washSoft = spec.washSoft ?? mixHex(spec.accent, toward, d ? 0.84 : 0.93);
  const secondaryWash = spec.secondaryWash ?? mixHex(spec.secondary, toward, d ? 0.72 : 0.85);
  const gradMid = spec.gradMid ?? mixHex(spec.accent, spec.secondary, 0.5);

  const ctaFromHover = spec.ctaFromHover ?? spec.ctaTo;
  const ctaToHover = spec.ctaToHover ?? mixHex(spec.ctaTo, "#ffffff", 0.22);
  const ctaMint = spec.ctaMint ?? [
    spec.secondary,
    spec.secondaryLight,
    mixHex(spec.secondary, "#ffffff", 0.15),
    mixHex(spec.secondaryLight, "#ffffff", 0.3),
  ];

  const glassRgbHex = spec.glassRgbHex ?? "#ffffff";
  const borderRgbHex = spec.glassBorderRgbHex ?? "#ffffff";
  const borderStrongHex =
    spec.glassBorderStrongHex ?? (d ? mixHex(borderRgbHex, spec.canvas, 0.5) : "#cbd5e1");
  const blobs = spec.blobs ?? deriveBlobs(spec, gradMid);

  return {
    id: spec.id,
    name: spec.name,
    tagline: spec.tagline,
    dark: d,
    material: spec.material,
    vars: {
      "--kv-canvas": tri(spec.canvas),
      "--kv-canvas-soft": tri(spec.canvasSoft),
      "--kv-ink": tri(spec.ink),
      "--kv-ink-muted": tri(spec.inkMuted),
      "--kv-ink-subtle": tri(spec.inkSubtle),
      "--kv-ink-strong": tri(spec.inkStrong),
      "--kv-accent": tri(spec.accent),
      "--kv-accent-light": tri(spec.accentLight),
      "--kv-accent-deep": tri(accentDeep),
      "--kv-accent-wash": tri(accentWash),
      "--kv-wash-soft": tri(washSoft),
      "--kv-mint": tri(spec.secondary),
      "--kv-mint-light": tri(spec.secondaryLight),
      "--kv-mint-wash": tri(secondaryWash),
      "--kv-grad-mid": tri(gradMid),
      "--kv-cta-ink": tri(spec.ctaInk ?? "#ffffff"),
      "--kv-glass-rgb": tri(glassRgbHex),
      "--kv-glass-a": String(spec.glassA ?? m.glassA),
      "--kv-glass-soft-a": String(spec.glassSoftA ?? m.glassSoftA),
      "--kv-glass-strong-a": String(spec.glassStrongA ?? m.glassStrongA),
      "--kv-glass-border-rgb": tri(borderRgbHex),
      "--kv-glass-border-a": String(spec.glassBorderA ?? m.borderA),
      "--kv-glass-border-strong-rgb": tri(borderStrongHex),
      "--kv-inset-a": String(spec.insetA ?? (d ? 0.08 : 0.9)),
      "--kv-blur-scale": String(m.blurScale),
      "--kv-sheen-a": String(m.sheenA),
      "--kv-blob-1a": blobs[0],
      "--kv-blob-1b": blobs[1],
      "--kv-blob-2a": blobs[2],
      "--kv-blob-2b": blobs[3],
      "--kv-blob-3a": blobs[4],
      "--kv-blob-3b": blobs[5],
      "--kv-blob-4a": blobs[6],
      "--kv-blob-4b": blobs[7],
      "--kv-blob-5a": blobs[8],
      "--kv-noise-a": String(spec.noiseA ?? (d ? 0.03 : 0.018)),
      "--kv-cta-from": spec.ctaFrom,
      "--kv-cta-to": spec.ctaTo,
      "--kv-cta-from-hover": ctaFromHover,
      "--kv-cta-to-hover": ctaToHover,
      "--kv-cta-mint-from": ctaMint[0],
      "--kv-cta-mint-to": ctaMint[1],
      "--kv-cta-mint-from-hover": ctaMint[2],
      "--kv-cta-mint-to-hover": ctaMint[3],
      "--kv-motion-scale": String(spec.motionScale),
    },
  };
}

// ------------------------------------------------------------- katalog

export const DEFAULT_THEME_ID = "crystal-intelligence";
export const CUSTOM_THEME_ID = "custom-ai";

const THEME_SPECS: ThemeSpec[] = [
  // 1. Default — "Royal Atelier": safir royal + emas antik + amethyst di
  //    porselen hangat. Nilai HARUS identik dengan :root globals.css
  //    (first paint tanpa JS == tema default). Kontras terverifikasi:
  //    ink 15.9:1 · inkMuted 6.2:1 · accent 6.4:1 · emas (teks) 5.25:1 (AA
  //    teks normal — diperdalam dari #9E752B/3.83:1 yang gagal AA di label
  //    kecil semibold, lihat CanvasToolbar.tsx & AiStudioCard.tsx) ·
  //    putih di rentang gradient CTA ≥ 3.2:1.
  {
    id: DEFAULT_THEME_ID,
    name: "Royal Atelier",
    tagline: "Safir, emas, porselen — mewah tenang",
    dark: false,
    material: "crystal",
    canvas: "#F7F5F2",
    canvasSoft: "#EFECE6",
    ink: "#191A23",
    inkMuted: "#5D5A66",
    inkSubtle: "#8F8C97",
    inkStrong: "#44424E",
    accent: "#2E4FC3",
    accentLight: "#5A76E0",
    accentDeep: "#22398F",
    accentWash: "#E2E6F7",
    washSoft: "#F2F4FB",
    secondary: "#84601F",
    secondaryLight: "#C9A356",
    secondaryWash: "#F3EEE6",
    gradMid: "#7D5AD1",
    ctaFrom: "#2E4FC3",
    ctaTo: "#5A54D9",
    ctaFromHover: "#3E5ED3",
    ctaToHover: "#6D67E4",
    ctaMint: ["#8F6A26", "#B08A45", "#9E752B", "#B98F49"],
    glassBorderStrongHex: "#D3CCC0",
    insetA: 0.9,
    noiseA: 0.018,
    motionScale: 1,
    blobs: [
      "rgba(90, 118, 224, 0.5)",
      "rgba(46, 79, 195, 0.26)",
      "rgba(125, 90, 209, 0.28)",
      "rgba(125, 90, 209, 0.14)",
      "rgba(158, 117, 43, 0.24)",
      "rgba(201, 163, 86, 0.13)",
      "rgba(90, 118, 224, 0.32)",
      "rgba(46, 79, 195, 0.16)",
      "rgba(173, 187, 240, 0.5)",
    ],
  },

  // 2. Jepang gelap premium — pink neon di atas malam biru.
  {
    id: "tokyo-future",
    name: "Tokyo Future",
    tagline: "Minimal Jepang, premium gelap",
    dark: true,
    material: "liquid",
    canvas: "#0B0E1A",
    canvasSoft: "#131730",
    ink: "#EDF2FF",
    inkMuted: "#96A0C2",
    inkSubtle: "#5F6A8F",
    inkStrong: "#C7CEE8",
    accent: "#EC4899",
    accentLight: "#F472B6",
    secondary: "#22D3EE",
    secondaryLight: "#67E8F9",
    ctaFrom: "#EC4899",
    ctaTo: "#8B5CF6",
    glassRgbHex: "#161A30",
    glassBorderRgbHex: "#A5B4FC",
    glassBorderA: 0.22,
    motionScale: 0.85,
  },

  // 3. CEO — hitam pekat, biru baja, kepercayaan tinggi.
  {
    id: "executive-black",
    name: "Executive Black",
    tagline: "Fokus, keputusan, wibawa",
    dark: true,
    material: "diamond",
    canvas: "#0C0D10",
    canvasSoft: "#15171C",
    ink: "#F4F5F7",
    inkMuted: "#9AA1AF",
    inkSubtle: "#6A7180",
    inkStrong: "#C2C7D0",
    accent: "#5B8DEF",
    accentLight: "#8AB0F8",
    secondary: "#34D399",
    secondaryLight: "#6EE7B7",
    ctaFrom: "#3E6FDB",
    ctaTo: "#5B8DEF",
    glassRgbHex: "#16181E",
    glassBorderRgbHex: "#FFFFFF",
    glassBorderA: 0.14,
    motionScale: 1,
  },

  // 4. Laut — segar, jernih, tenang.
  {
    id: "ocean-glass",
    name: "Ocean Glass",
    tagline: "Segar, jernih, tenang",
    dark: false,
    material: "liquid",
    canvas: "#F0F9FC",
    canvasSoft: "#E2F1F8",
    ink: "#0C2D42",
    inkMuted: "#47697E",
    inkSubtle: "#7D9BAD",
    inkStrong: "#35566B",
    accent: "#0891B2",
    accentLight: "#06B6D4",
    // Cyan-600 hanya ~3.9:1 di kanvas ini — aman untuk elemen besar/tebal;
    // teks aksen kecil memakai accent-deep (cyan-700) via ::selection dsb.
    accentDeep: "#0E7490",
    secondary: "#10B981",
    secondaryLight: "#34D399",
    ctaFrom: "#0891B2",
    ctaTo: "#06B6D4",
    motionScale: 1,
  },

  // 5. UMKM — organik, hangat, tumbuh. (Aksen green-600 ~3.1:1: elemen
  // interaktif/besar saja; teks tubuh tetap ink.)
  {
    id: "nature-founder",
    name: "Nature Founder",
    tagline: "Organik, hangat, bertumbuh",
    dark: false,
    material: "organic",
    canvas: "#F7FAF3",
    canvasSoft: "#ECF3E4",
    ink: "#1C2A17",
    inkMuted: "#57684E",
    inkSubtle: "#86977B",
    inkStrong: "#44543C",
    accent: "#16A34A",
    accentLight: "#22C55E",
    secondary: "#D97706",
    secondaryLight: "#F59E0B",
    ctaFrom: "#16A34A",
    ctaTo: "#22C55E",
    motionScale: 1.1,
  },

  // 6. Kreator konten — energik, cepat, berani.
  {
    id: "creator-energy",
    name: "Creator Energy",
    tagline: "Cepat, energik, trend-first",
    dark: false,
    material: "liquid",
    canvas: "#FDF7FA",
    canvasSoft: "#FAEAF2",
    ink: "#2A1022",
    inkMuted: "#7E5A6F",
    inkSubtle: "#B08CA0",
    inkStrong: "#64445A",
    accent: "#DB2777",
    accentLight: "#F472B6",
    secondary: "#F97316",
    secondaryLight: "#FB923C",
    ctaFrom: "#DB2777",
    ctaTo: "#F97316",
    motionScale: 0.85,
  },

  // 7. Futuristik — ungu lab di kegelapan.
  {
    id: "ai-laboratory",
    name: "AI Laboratory",
    tagline: "Futuristik, inovasi",
    dark: true,
    material: "frost",
    canvas: "#0F0B1E",
    canvasSoft: "#191330",
    ink: "#F0ECFF",
    inkMuted: "#9E94C4",
    inkSubtle: "#6C6296",
    inkStrong: "#C4BBE4",
    accent: "#8B5CF6",
    accentLight: "#A78BFA",
    secondary: "#22D3EE",
    secondaryLight: "#67E8F9",
    ctaFrom: "#8B5CF6",
    ctaTo: "#6366F1",
    glassRgbHex: "#1E183A",
    glassBorderRgbHex: "#A78BFA",
    glassBorderA: 0.2,
    motionScale: 1,
  },

  // 8. Apple-inspired — putih murni, hairline gelap (alasan border-rgb
  // terpisah dari glass-rgb).
  {
    id: "white-vision",
    name: "White Vision",
    tagline: "Putih murni, presisi Apple",
    dark: false,
    material: "diamond",
    canvas: "#FFFFFF",
    canvasSoft: "#F6F7F9",
    ink: "#16181D",
    inkMuted: "#6B7280",
    inkSubtle: "#9CA3AF",
    inkStrong: "#374151",
    accent: "#1F2937",
    accentLight: "#4B5563",
    secondary: "#0D9488",
    secondaryLight: "#2DD4BF",
    ctaFrom: "#111827",
    ctaTo: "#374151",
    glassA: 0.7,
    glassSoftA: 0.5,
    glassStrongA: 0.85,
    glassBorderRgbHex: "#111827",
    glassBorderA: 0.08,
    glassBorderStrongHex: "#D1D5DB",
    noiseA: 0.012,
    motionScale: 1.15,
  },

  // 9. Brand premium — emas di atas hitam pekat. CTA emas butuh teks GELAP
  // (putih-di-emas cuma ~1.9:1 — inilah alasan --kv-cta-ink ada).
  {
    id: "luxury-gold",
    name: "Luxury Gold",
    tagline: "Brand premium, mewah",
    dark: true,
    material: "crystal",
    canvas: "#120E08",
    canvasSoft: "#1D1710",
    ink: "#F5EEDC",
    inkMuted: "#B3A588",
    inkSubtle: "#7E7360",
    inkStrong: "#D8CCAE",
    accent: "#D4AF37",
    accentLight: "#E8C96A",
    secondary: "#059669",
    secondaryLight: "#34D399",
    ctaFrom: "#D4AF37",
    ctaTo: "#E8C96A",
    ctaInk: "#1A1408",
    glassRgbHex: "#221B10",
    glassBorderRgbHex: "#D4AF37",
    glassBorderA: 0.22,
    noiseA: 0.028,
    motionScale: 1.2,
  },
];

export const THEME_PRESETS: KvTheme[] = THEME_SPECS.map(buildTheme);

/** Spec mentah preset — dipakai themeGenerator untuk me-recolor basis. */
export function getThemeSpec(id: string): ThemeSpec | undefined {
  return THEME_SPECS.find((s) => s.id === id);
}

/** Fallback slot "Custom AI" sebelum pengguna men-generate tema sendiri. */
export function customThemeFallback(): KvTheme {
  const base = THEME_PRESETS[0];
  return {
    ...base,
    id: CUSTOM_THEME_ID,
    name: "Custom AI",
    tagline: "Deskripsikan workspace impianmu",
    isCustom: true,
    vars: { ...base.vars },
  };
}
