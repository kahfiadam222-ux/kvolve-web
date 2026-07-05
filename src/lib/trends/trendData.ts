/**
 * Trend Data — katalog tren lokal/mock (Micro-Trending Board & Vibe-Match
 * Radar). PRD aslinya minta pipeline scraping TikTok/IG/X + cron job, tapi
 * codebase ini belum punya backend sama sekali (tanpa src/app/api, tanpa
 * cron). Modul ini sengaja berbentuk katalog statis-tapi-bertipe — bentuk
 * datanya dirancang supaya sumber data asli (scraping/API) bisa ditukar di
 * sini nanti TANPA mengubah komponen UI yang mengonsumsinya.
 *
 * `dominantColor` ditulis tangan per entri (bukan diekstrak runtime dari
 * thumbnail) untuk menghindari risiko "tainted canvas" (CORS) saat memakai
 * `colorExtract.ts` pada gambar hasil hotlink — lihat catatan di sana.
 */

export type TrendPlatform = "tiktok" | "instagram" | "x";

export type TrendVelocity = "rising" | "hot" | "peaking";

export interface TrendItem {
  id: string;
  platform: TrendPlatform;
  title: string;
  /** Gradient CSS — placeholder thumbnail, sama pola dengan THUMB_GRADIENTS. */
  thumbnail: string;
  velocity: TrendVelocity;
  hashtag: string;
  audioLabel?: string;
  /** Warna hex yang diinjeksikan ke latar artboard via "Terapkan Gaya". */
  dominantColor: string;
  /** Tag estetika — dipakai Vibe-Match Radar untuk mencocokkan balik. */
  tags: string[];
}

export const VELOCITY_LABEL: Record<TrendVelocity, string> = {
  rising: "Naik",
  hot: "Panas",
  peaking: "Puncak",
};

export const PLATFORM_LABEL: Record<TrendPlatform, string> = {
  tiktok: "TikTok",
  instagram: "Instagram",
  x: "X",
};

export const TREND_CATALOG: TrendItem[] = [
  {
    id: "t-softblue",
    platform: "instagram",
    title: "Soft Blue Morning",
    thumbnail: "linear-gradient(135deg,#dbeafe,#93c5fd)",
    velocity: "hot",
    hashtag: "#softblue",
    dominantColor: "#93c5fd",
    tags: ["soft", "clean", "calm"],
  },
  {
    id: "t-darkanime",
    platform: "tiktok",
    title: "Dark Anime Edit",
    thumbnail: "linear-gradient(135deg,#0f172a,#334155)",
    velocity: "peaking",
    hashtag: "#darkanime",
    audioLabel: "Lo-fi Battle Theme",
    dominantColor: "#1e293b",
    tags: ["dark", "anime", "editorial"],
  },
  {
    id: "t-y2kpink",
    platform: "tiktok",
    title: "Y2K Pink Vibes",
    thumbnail: "linear-gradient(135deg,#fce7f3,#f9a8d4)",
    velocity: "hot",
    hashtag: "#y2kpink",
    audioLabel: "Bubblegum Pop Remix",
    dominantColor: "#f472b6",
    tags: ["y2k", "vibrant", "playful"],
  },
  {
    id: "t-mintclean",
    platform: "instagram",
    title: "Fresh Mint Studio",
    thumbnail: "linear-gradient(135deg,#ccfbf1,#5eead4)",
    velocity: "rising",
    hashtag: "#mintaesthetic",
    dominantColor: "#2dd4bf",
    tags: ["clean", "fresh", "minimal"],
  },
  {
    id: "t-goldenluxury",
    platform: "x",
    title: "Golden Hour Luxury",
    thumbnail: "linear-gradient(135deg,#fef3c7,#fbbf24)",
    velocity: "peaking",
    hashtag: "#goldenhour",
    dominantColor: "#d97706",
    tags: ["luxury", "warm", "editorial"],
  },
  {
    id: "t-lavenderdream",
    platform: "instagram",
    title: "Lavender Dreamcore",
    thumbnail: "linear-gradient(135deg,#e0e7ff,#a5b4fc)",
    velocity: "rising",
    hashtag: "#dreamcore",
    dominantColor: "#818cf8",
    tags: ["soft", "dreamy", "y2k"],
  },
  {
    id: "t-monoeditorial",
    platform: "x",
    title: "Mono Editorial",
    thumbnail: "linear-gradient(135deg,#f1f5f9,#94a3b8)",
    velocity: "hot",
    hashtag: "#monoeditorial",
    dominantColor: "#475569",
    tags: ["minimal", "editorial", "dark"],
  },
  {
    id: "t-greenforest",
    platform: "tiktok",
    title: "Forest Green Reset",
    thumbnail: "linear-gradient(135deg,#d1fae5,#6ee7b7)",
    velocity: "rising",
    hashtag: "#forestreset",
    audioLabel: "Ambient Field Recording",
    dominantColor: "#10b981",
    tags: ["calm", "fresh", "clean"],
  },
  {
    id: "t-sunsetpeach",
    platform: "instagram",
    title: "Sunset Peach Fade",
    thumbnail: "linear-gradient(135deg,#fff7ed,#fed7aa)",
    velocity: "hot",
    hashtag: "#sunsetpeach",
    dominantColor: "#fb923c",
    tags: ["warm", "playful", "vibrant"],
  },
  {
    id: "t-electricviolet",
    platform: "x",
    title: "Electric Violet Pulse",
    thumbnail: "linear-gradient(135deg,#ede9fe,#c4b5fd)",
    velocity: "peaking",
    hashtag: "#electricviolet",
    dominantColor: "#8b5cf6",
    tags: ["vibrant", "y2k", "playful"],
  },
];
