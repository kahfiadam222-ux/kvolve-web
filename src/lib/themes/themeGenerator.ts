import {
  CUSTOM_THEME_ID,
  DEFAULT_THEME_ID,
  buildTheme,
  getThemeSpec,
  mixHex,
  type KvTheme,
  type ThemeSpec,
} from "./themeData";

/**
 * AI Theme Generator — pencocok BERBASIS ATURAN, sinkron, tanpa panggilan
 * AI/jaringan (pola sama dengan aestheticMatch.ts). "AI"-nya adalah kamus
 * kata kunci: deskripsi pengguna memilih preset basis, lalu kata warna
 * eksplisit me-recolor keluarga aksennya. Cukup untuk menghadirkan
 * pengalaman "describe your dream workspace" secara jujur hari ini, dan
 * mudah ditukar dengan model sungguhan nanti tanpa mengubah pemanggil.
 */

interface BaseRule {
  keywords: string[];
  baseId: string;
}

// Urutan = prioritas (kecocokan pertama menang).
const BASE_RULES: BaseRule[] = [
  { keywords: ["mewah", "emas", "gold", "luxury", "premium", "elegan"], baseId: "luxury-gold" },
  { keywords: ["jepang", "japan", "tokyo", "neon", "cyber", "malam kota"], baseId: "tokyo-future" },
  { keywords: ["alam", "hijau", "organik", "natural", "daun", "hutan", "umkm"], baseId: "nature-founder" },
  { keywords: ["laut", "ocean", "air", "pantai", "samudra", "segar"], baseId: "ocean-glass" },
  { keywords: ["lab", "sains", "futuristik", "teknologi", "inovasi", " ai "], baseId: "ai-laboratory" },
  { keywords: ["minimal", "putih", "bersih", "apple", "simpel", "polos"], baseId: "white-vision" },
  { keywords: ["kreator", "fashion", "energik", "konten", "sosial", "trend", "viral"], baseId: "creator-energy" },
  { keywords: ["gelap", "hitam", "eksekutif", "ceo", "fokus", "bisnis"], baseId: "executive-black" },
];

interface ColorRule {
  keywords: string[];
  accent: string;
  accentLight: string;
}

const COLOR_RULES: ColorRule[] = [
  { keywords: ["merah", "red"], accent: "#DC2626", accentLight: "#F87171" },
  { keywords: ["oranye", "orange", "jingga"], accent: "#EA580C", accentLight: "#FB923C" },
  { keywords: ["kuning", "yellow"], accent: "#CA8A04", accentLight: "#FACC15" },
  { keywords: ["hijau", "green"], accent: "#16A34A", accentLight: "#22C55E" },
  { keywords: ["toska", "cyan", "teal"], accent: "#0891B2", accentLight: "#06B6D4" },
  { keywords: ["biru", "blue"], accent: "#2563EB", accentLight: "#3B82F6" },
  { keywords: ["ungu", "purple", "violet"], accent: "#8B5CF6", accentLight: "#A78BFA" },
  { keywords: ["pink", "merah muda", "magenta"], accent: "#DB2777", accentLight: "#F472B6" },
  { keywords: ["emas", "gold"], accent: "#D4AF37", accentLight: "#E8C96A" },
];

/** Ubah deskripsi bebas menjadi tema custom lengkap. */
export function generateTheme(input: string): KvTheme {
  const q = ` ${input.toLowerCase().trim()} `;

  const baseRule = BASE_RULES.find((r) => r.keywords.some((k) => q.includes(k)));
  const baseSpec =
    getThemeSpec(baseRule?.baseId ?? DEFAULT_THEME_ID) ??
    getThemeSpec(DEFAULT_THEME_ID)!;

  // Buang turunan hasil override basis agar buildTheme menghitung ulang
  // wash/deep/gradien dari aksen baru (kalau ada recolor).
  const {
    accentDeep: _d,
    accentWash: _w,
    washSoft: _ws,
    secondaryWash: _sw,
    gradMid: _g,
    ctaFromHover: _fh,
    ctaToHover: _th,
    ctaMint: _cm,
    blobs: _b,
    ...rest
  } = baseSpec;

  const spec: ThemeSpec = { ...rest };

  const colorRule = COLOR_RULES.find((r) => r.keywords.some((k) => q.includes(k)));
  if (colorRule) {
    spec.accent = colorRule.accent;
    spec.accentLight = colorRule.accentLight;
    spec.ctaFrom = colorRule.accent;
    spec.ctaTo = colorRule.accentLight;
    // Emas di CTA butuh teks gelap (kontras) — kasus yang sama dengan
    // preset Luxury Gold.
    spec.ctaInk = colorRule.accent === "#D4AF37" ? "#1A1408" : "#FFFFFF";
  }

  const label = input.trim().slice(0, 40) || "Workspace impianku";
  spec.id = CUSTOM_THEME_ID;
  spec.name = `Workspace: ${label}`;
  spec.tagline = "Tema hasil AI Theme Generator";

  const theme = buildTheme(spec);
  return { ...theme, isCustom: true };
}

export interface PersonaRecommendation {
  persona: string;
  themeId: string;
  why: string;
}

/** Smart Theme Recommendation — pemetaan persona -> preset (sesuai PRD). */
export const PERSONA_RECOMMENDATIONS: PersonaRecommendation[] = [
  {
    persona: "Kreator Konten",
    themeId: "creator-energy",
    why: "Alur konten cepat, energi tinggi, fokus tren",
  },
  {
    persona: "Founder / CEO",
    themeId: "executive-black",
    why: "Fokus, pengambilan keputusan, profesional",
  },
  {
    persona: "UMKM",
    themeId: "nature-founder",
    why: "Hangat, membangun kepercayaan, natural",
  },
  {
    persona: "Profesional",
    themeId: "crystal-intelligence",
    why: "Bersih, netral, siap kerja apa pun",
  },
];
