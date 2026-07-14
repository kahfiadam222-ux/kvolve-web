import { listProjects, timeAgo } from "@/lib/projects/localProjects";

/**
 * profileData — lapisan data untuk User Profile & Stories (PRD Addendum 03).
 *
 * SENGAJA terisolasi dari state editor kanvas (`useCanvasStore`): modul ini
 * hanya membaca daftar proyek (localProjects) untuk Featured Projects dan
 * localStorage untuk state follow — tidak pernah menyentuh rendering
 * real-time kanvas, sesuai "Aturan Proteksi Kode" di PRD.
 *
 * Selama MVP data profil bersifat statis/mock + localStorage. Saat Supabase
 * Auth (W-FR-1.1) aktif, `getProfile` tinggal ditukar dengan query tabel
 * `profiles` tanpa mengubah komponen.
 */

export type SocialPlatform =
  | "instagram"
  | "tiktok"
  | "facebook"
  | "reddit"
  | "github"
  | "x";

export interface SocialLink {
  platform: SocialPlatform;
  /** Nama tampilan tautan, mis. "@kahfi". */
  handle: string;
  url: string;
}

export type StoryKind = "snapshot" | "text";

export interface Story {
  id: string;
  kind: StoryKind;
  /** Epoch ms — dipakai untuk kedaluwarsa 24 jam. */
  createdAt: number;
  /** Untuk kind "snapshot": data URL JPEG hasil Secure Snapshot kanvas. */
  image?: string;
  /** Fallback visual bila tidak ada image (story demo): gradient CSS. */
  gradient?: string;
  /** Untuk kind "text": isi status. */
  text?: string;
  /** Proyek asal — memungkinkan "Remix from Story" (Ide Tambahan A). */
  projectId?: string;
  projectName?: string;
}

export interface FeaturedProject {
  id: string;
  name: string;
  /** Keterangan waktu relatif, mis. "2 jam lalu". */
  meta: string;
  /** Gradient thumbnail mini (mock — snapshot kanvas menyusul). */
  gradient: string;
}

export interface UserProfile {
  username: string;
  name: string;
  bio: string;
  avatarGradient: string;
  initials: string;
  /** Verified Creator Badge (Ide Tambahan B). */
  verified: boolean;
  followers: number;
  following: number;
  socials: SocialLink[];
  featured: FeaturedProject[];
  stories: Story[];
}

// ------------------------------------------------------------- konstanta

export const STORY_TTL_MS = 24 * 60 * 60 * 1000; // 24 jam (PRD 3)
const HOUR = 60 * 60 * 1000;

// Gradasi pastel Crystal OS — sama dengan palet ProjectGallery.tsx, dipakai
// untuk kartu kaca TERANG shell aplikasi.
const THUMB_GRADIENTS = [
  "linear-gradient(135deg,#dbeafe,#93c5fd)",
  "linear-gradient(135deg,#ccfbf1,#5eead4)",
  "linear-gradient(135deg,#e0e7ff,#a5b4fc)",
  "linear-gradient(135deg,#d1fae5,#6ee7b7)",
  "linear-gradient(135deg,#fce7f3,#f9a8d4)",
];

const gradientFor = (seed: string): string => {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return THUMB_GRADIENTS[h % THUMB_GRADIENTS.length];
};

const initialsFrom = (name: string): string =>
  name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("") || "K";

// ------------------------------------------------------------- profil

/**
 * Profil demo untuk username tertentu. Featured Projects diisi dari proyek
 * lokal pengguna (maksimal 5, sesuai PRD 2) agar showcase-nya nyata; bila
 * belum ada proyek, dipakai placeholder.
 *
 * `now` di-inject agar deterministik/testable (default Date.now()).
 */
export function getProfile(username: string, now: number = Date.now()): UserProfile {
  const clean = (username || "kahfi").replace(/^@/, "");
  const isOwner = clean.toLowerCase() === "kahfi";
  const name = isOwner ? "Kahfi Adam" : capitalize(clean);

  const projects = listProjects();
  const featured: FeaturedProject[] = (
    projects.length > 0
      ? projects.slice(0, 5).map((p) => ({
          id: p.id,
          name: p.name,
          meta: `Diubah ${timeAgo(p.updatedAt)}`,
          gradient: gradientFor(p.id),
        }))
      : PLACEHOLDER_FEATURED
  );

  return {
    username: clean,
    name,
    bio: isOwner
      ? "Membangun Kvolve — infinite canvas untuk desain, PDF & layout HTML. Kolaborasi tanpa batas."
      : "Kreator di ekosistem Kvolve.",
    avatarGradient: "linear-gradient(135deg,#3B82F6,#14B8A6)",
    initials: initialsFrom(name),
    verified: isOwner,
    followers: isOwner ? 1284 : 42,
    following: isOwner ? 312 : 87,
    socials: isOwner ? OWNER_SOCIALS : [],
    featured,
    // Profil sendiri: story snapshot NYATA milik pengguna tampil lebih dulu,
    // disusul story demo agar barisan tidak kosong saat pertama kali.
    stories: isOwner
      ? [...listUserStories(now), ...seededStories(clean, featured, now)]
      : seededStories(clean, featured, now),
  };
}

const OWNER_SOCIALS: SocialLink[] = [
  { platform: "instagram", handle: "@kvolve.app", url: "https://instagram.com/kvolve.app" },
  { platform: "tiktok", handle: "@kvolve", url: "https://tiktok.com/@kvolve" },
  { platform: "facebook", handle: "Kvolve", url: "https://facebook.com/kvolve" },
  { platform: "reddit", handle: "u/kvolve", url: "https://reddit.com/user/kvolve" },
  { platform: "github", handle: "kahfiadam222-ux", url: "https://github.com/kahfiadam222-ux" },
  { platform: "x", handle: "@kvolve", url: "https://x.com/kvolve" },
];

const PLACEHOLDER_FEATURED: FeaturedProject[] = [
  { id: "demo-project", name: "Kanvas Demo", meta: "Contoh proyek", gradient: THUMB_GRADIENTS[0] },
];

/** Story demo dengan createdAt dalam 24 jam terakhir agar tampil aktif. */
function seededStories(
  username: string,
  featured: FeaturedProject[],
  now: number,
): Story[] {
  const first = featured[0];
  return [
    {
      id: `${username}-s1`,
      kind: "snapshot",
      createdAt: now - 2 * HOUR,
      gradient: "linear-gradient(160deg,#2563EB,#60A5FA)",
      projectId: first?.id,
      projectName: first?.name,
    },
    {
      id: `${username}-s2`,
      kind: "text",
      createdAt: now - 6 * HOUR,
      text: "Progres hari ini: artboard baru siap diremix ✨",
    },
    {
      id: `${username}-s3`,
      kind: "snapshot",
      createdAt: now - 20 * HOUR,
      gradient: "linear-gradient(160deg,#0D9488,#5EEAD4)",
      projectId: featured[1]?.id,
      projectName: featured[1]?.name,
    },
  ];
}

/** Story yang belum kedaluwarsa (< 24 jam). PRD 3: durasi hidup 24 jam. */
export function activeStories(stories: Story[], now: number = Date.now()): Story[] {
  return stories.filter((s) => now - s.createdAt < STORY_TTL_MS);
}

// ------------------------------------------------------- story pengguna

const STORIES_KEY = "kvolve:stories";

/**
 * Story milik pengguna (hasil Secure Snapshot kanvas) — localStorage,
 * kedaluwarsa otomatis 24 jam. Yang kedaluwarsa dipangkas saat dibaca
 * agar penyimpanan tidak menumpuk data URL gambar lama.
 */
export function listUserStories(now: number = Date.now()): Story[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORIES_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(parsed)) return [];
    const valid = parsed.filter(
      (s): s is Story =>
        typeof s === "object" &&
        s !== null &&
        typeof (s as Story).id === "string" &&
        typeof (s as Story).createdAt === "number",
    );
    const alive = activeStories(valid, now);
    if (alive.length !== valid.length) {
      window.localStorage.setItem(STORIES_KEY, JSON.stringify(alive));
    }
    return alive.sort((a, b) => b.createdAt - a.createdAt);
  } catch {
    return [];
  }
}

/**
 * Simpan snapshot kanvas sebagai story baru. Mengembalikan story-nya, atau
 * null bila penyimpanan gagal (mis. kuota localStorage penuh) — pemanggil
 * bisa menampilkan pesan yang sesuai.
 */
export function addSnapshotStory(input: {
  image: string;
  projectId?: string;
  projectName?: string;
}): Story | null {
  if (typeof window === "undefined") return null;
  const story: Story = {
    id: `snap-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`,
    kind: "snapshot",
    createdAt: Date.now(),
    image: input.image,
    projectId: input.projectId,
    projectName: input.projectName,
  };
  try {
    const next = [story, ...listUserStories()];
    window.localStorage.setItem(STORIES_KEY, JSON.stringify(next));
    return story;
  } catch {
    return null; // kuota penuh — jangan crash alur pengguna
  }
}

/** Sisa waktu hidup story dalam format ringkas, mis. "4 jam" / "12 mnt". */
export function storyTimeLeft(story: Story, now: number = Date.now()): string {
  const ms = Math.max(0, STORY_TTL_MS - (now - story.createdAt));
  const h = Math.floor(ms / HOUR);
  if (h >= 1) return `${h} jam`;
  return `${Math.max(1, Math.floor(ms / (60 * 1000)))} mnt`;
}

/**
 * Kirim reaksi emoji ke story — stub "background thread". Belum ada
 * backend, jadi ini hanya mensimulasikan pengiriman async non-blocking;
 * tukar dengan panggilan API sungguhan begitu backend tersedia (pola sama
 * seperti `getProfile` menunggu Supabase Auth di komentar file ini).
 */
export function sendReaction(storyId: string, emoji: string): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, 150 + Math.random() * 150);
  });
}

// -------------------------------------------------------- state follow

const followKey = (username: string) => `kvolve:following:${username}`;

export function isFollowing(username: string): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(followKey(username)) === "1";
  } catch {
    return false;
  }
}

/** Toggle follow; mengembalikan status baru. */
export function toggleFollow(username: string): boolean {
  const next = !isFollowing(username);
  if (typeof window !== "undefined") {
    try {
      if (next) window.localStorage.setItem(followKey(username), "1");
      else window.localStorage.removeItem(followKey(username));
    } catch {
      /* abaikan storage penuh/terblokir */
    }
  }
  return next;
}

// ----------------------------------------------------------------- util

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
