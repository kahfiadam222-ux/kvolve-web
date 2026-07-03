/**
 * Canvas Presets — struktur data Studio Desain.
 *
 * Semua dimensi dalam piksel. Preset cetak memakai rasio 300 DPI
 * (mis. kartu nama 90 × 55 mm -> 1063 × 650 px) sehingga hasil ekspor
 * aman untuk percetakan.
 */

export type PresetIconKey =
  | "custom"
  | "instagram"
  | "facebook"
  | "youtube"
  | "x"
  | "tiktok"
  | "presentation"
  | "catalog"
  | "resume"
  | "namecard"
  | "poster"
  | "brochure"
  | "invitation";

export interface CanvasPreset {
  id: string;
  /** Nama template, mis. "Stories". */
  name: string;
  /** Platform / subkelompok, mis. "Instagram" — jadi subjudul di UI. */
  group: string;
  icon: PresetIconKey;
  width: number;
  height: number;
  /** Keterangan tambahan di bawah dimensi, mis. "Setara A3". */
  note?: string;
}

export interface PresetCategory {
  id: string;
  label: string;
  presets: CanvasPreset[];
}

// --------------------------------------------------------- konversi satuan

export const PRINT_DPI = 300;
const CM_PER_INCH = 2.54;

/** Konversi sentimeter -> piksel pada resolusi cetak aman (300 DPI). */
export const cmToPx = (cm: number): number =>
  Math.round((cm / CM_PER_INCH) * PRINT_DPI);

/** Batas wajar dimensi artboard (px) agar GPU & memori tetap sehat. */
export const MIN_ARTBOARD_PX = 16;
export const MAX_ARTBOARD_PX = 20_000;

// ----------------------------------------------------------------- presets

export const PRESET_CATEGORIES: PresetCategory[] = [
  {
    id: "social",
    label: "Media Sosial",
    presets: [
      { id: "ig-post", group: "Instagram", name: "Postingan Kotak", icon: "instagram", width: 1080, height: 1080 },
      { id: "ig-story", group: "Instagram", name: "Stories", icon: "instagram", width: 1080, height: 1920 },
      { id: "ig-reels", group: "Instagram", name: "Reels", icon: "instagram", width: 1080, height: 1920 },
      { id: "fb-post", group: "Facebook", name: "Postingan Timeline", icon: "facebook", width: 1200, height: 630 },
      { id: "fb-cover", group: "Facebook", name: "Foto Sampul", icon: "facebook", width: 851, height: 315 },
      { id: "yt-thumbnail", group: "YouTube", name: "Thumbnail", icon: "youtube", width: 1280, height: 720 },
      { id: "yt-banner", group: "YouTube", name: "Banner Channel", icon: "youtube", width: 2560, height: 1440 },
      { id: "x-post", group: "X (Twitter)", name: "Postingan Gambar", icon: "x", width: 1600, height: 900 },
      { id: "x-header", group: "X (Twitter)", name: "Header Banner", icon: "x", width: 1500, height: 500 },
      { id: "tiktok-cover", group: "TikTok", name: "Video Cover", icon: "tiktok", width: 1080, height: 1920 },
    ],
  },
  {
    id: "business",
    label: "Presentasi & Bisnis",
    presets: [
      { id: "ppt-widescreen", group: "PPT / Presentasi", name: "Widescreen 16:9", icon: "presentation", width: 1920, height: 1080 },
      { id: "ppt-standard", group: "PPT / Presentasi", name: "Standard 4:3", icon: "presentation", width: 1024, height: 768 },
      { id: "catalog-a4", group: "Katalog", name: "Katalog Digital A4", icon: "catalog", width: 2480, height: 3508, note: "A4 · portrait" },
    ],
  },
  {
    id: "branding",
    label: "Dokumen & Branding",
    presets: [
      { id: "cv-a4", group: "CV / Resume", name: "Standar A4", icon: "resume", width: 2480, height: 3508, note: "Aman cetak & ATS" },
      { id: "cv-letter", group: "CV / Resume", name: "US Letter", icon: "resume", width: 2550, height: 3300, note: "Aman cetak & ATS" },
      { id: "namecard-id", group: "Kartu Nama", name: "Standar Indonesia", icon: "namecard", width: 1063, height: 650, note: "90 × 55 mm · 300 DPI" },
    ],
  },
  {
    id: "marketing",
    label: "Pemasaran & Acara",
    presets: [
      { id: "poster-a3", group: "Poster", name: "Poster Standar", icon: "poster", width: 3508, height: 4960, note: "Setara A3" },
      { id: "brochure-trifold", group: "Brosur", name: "Lipat Tiga / A4 Horisontal", icon: "brochure", width: 3508, height: 2480, note: "A4 · landscape" },
      { id: "invitation-print", group: "Undangan", name: "Digital / Cetak", icon: "invitation", width: 1417, height: 1984, note: "12 × 16,8 cm" },
      { id: "invitation-portrait", group: "Undangan", name: "Portrait Smartphone", icon: "invitation", width: 1080, height: 1920 },
    ],
  },
];
