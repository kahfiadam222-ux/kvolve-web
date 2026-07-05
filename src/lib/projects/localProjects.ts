import { nanoid } from "nanoid";
import type { ArtboardState, CanvasObject } from "@/types/canvas";

/**
 * localProjects — penyimpanan proyek MVP berbasis localStorage
 * (W-FR-1.2 Workspace Dashboard: lihat / buat / ganti nama / hapus).
 *
 * Sengaja sinkron & sederhana: satu kunci untuk daftar proyek, satu kunci
 * artboard per proyek. Saat Supabase Auth aktif (W-FR-1.1), modul ini
 * tinggal ditukar dengan query tabel `projects` tanpa menyentuh UI —
 * seluruh akses dashboard sudah lewat fungsi-fungsi di sini.
 *
 * Semua fungsi aman dipanggil di server (mengembalikan nilai kosong) dan
 * tahan terhadap localStorage yang penuh/terblokir (try/catch senyap).
 */

export interface ProjectMeta {
  id: string;
  name: string;
  /** Epoch ms terakhir kali proyek diubah/dibuka. */
  updatedAt: number;
}

const PROJECTS_KEY = "kvolve:projects";
const SEEDED_KEY = "kvolve:seeded";
const artboardKey = (projectId: string) => `kvolve:artboard:${projectId}`;
const objectsKey = (projectId: string) => `kvolve:objects:${projectId}`;
/** Batas ukuran serialisasi objek per proyek (aset di-embed sebagai data URL). */
const MAX_OBJECTS_JSON = 4_500_000; // ~4.5MB — di bawah kuota umum localStorage

const hasStorage = (): boolean => typeof window !== "undefined";

function readAll(): ProjectMeta[] {
  if (!hasStorage()) return [];
  try {
    const raw = window.localStorage.getItem(PROJECTS_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(parsed)) return [];
    const valid = parsed.filter(
      (p): p is ProjectMeta =>
        typeof p === "object" &&
        p !== null &&
        typeof (p as ProjectMeta).id === "string" &&
        typeof (p as ProjectMeta).name === "string" &&
        typeof (p as ProjectMeta).updatedAt === "number",
    );
    // Dedupe id — pertahanan terhadap penulisan silang antar-tab yang
    // (jarang) menghasilkan entri ganda; entri pertama menang.
    const seen = new Set<string>();
    return valid.filter((p) => (seen.has(p.id) ? false : (seen.add(p.id), true)));
  } catch {
    return [];
  }
}

function writeAll(projects: ProjectMeta[]): void {
  if (!hasStorage()) return;
  try {
    window.localStorage.setItem(PROJECTS_KEY, JSON.stringify(projects));
  } catch {
    // Penyimpanan penuh/terblokir: dashboard tetap berfungsi untuk sesi ini.
  }
}

// ------------------------------------------------------------------ CRUD

/** Daftar proyek, terbaru dulu. Menyemai "Kanvas Demo" pada kunjungan pertama. */
export function listProjects(): ProjectMeta[] {
  if (!hasStorage()) return [];
  let projects = readAll();
  try {
    if (projects.length === 0 && !window.localStorage.getItem(SEEDED_KEY)) {
      projects = [{ id: "demo-project", name: "Kanvas Demo", updatedAt: Date.now() }];
      writeAll(projects);
      window.localStorage.setItem(SEEDED_KEY, "1");
    }
  } catch {
    /* abaikan */
  }
  return [...projects].sort((a, b) => b.updatedAt - a.updatedAt);
}

export function createProject(name = "Desain tanpa judul"): ProjectMeta {
  const project: ProjectMeta = { id: nanoid(10), name, updatedAt: Date.now() };
  writeAll([project, ...readAll()]);
  return project;
}

export function renameProject(id: string, name: string): void {
  const trimmed = name.trim();
  if (!trimmed) return;
  const projects = readAll();
  const target = projects.find((p) => p.id === id);
  // Lewati bila nama tidak berubah — hindari penulisan & bump updatedAt sia-sia
  // (yang juga akan memicu event storage di tab lain tanpa alasan).
  if (!target || target.name === trimmed) return;
  writeAll(
    projects.map((p) =>
      p.id === id ? { ...p, name: trimmed, updatedAt: Date.now() } : p,
    ),
  );
}

export function deleteProject(id: string): void {
  writeAll(readAll().filter((p) => p.id !== id));
  if (hasStorage()) {
    try {
      window.localStorage.removeItem(artboardKey(id));
      window.localStorage.removeItem(objectsKey(id));
    } catch {
      /* abaikan */
    }
  }
}

/** Sentuh stempel waktu (dipanggil saat kanvas proyek dibuka). */
export function touchProject(id: string): void {
  writeAll(
    readAll().map((p) => (p.id === id ? { ...p, updatedAt: Date.now() } : p)),
  );
}

// ---------------------------------------------------------- sinkron tab

/**
 * Berlangganan perubahan daftar proyek dari TAB LAIN (event `storage` hanya
 * dipicu di tab selain yang menulis). Membuat dashboard yang terbuka di
 * beberapa tab tetap konsisten — buat/rename/hapus di satu tab langsung
 * tercermin di tab lain. Mengembalikan fungsi berhenti-langganan.
 */
export function subscribeProjects(onChange: () => void): () => void {
  if (!hasStorage()) return () => {};
  const handler = (e: StorageEvent): void => {
    // key === null saat localStorage.clear(); tangani juga itu.
    if (e.key === null || e.key === PROJECTS_KEY) onChange();
  };
  window.addEventListener("storage", handler);
  return () => window.removeEventListener("storage", handler);
}

// -------------------------------------------------------------- artboard

/** Artboard tersimpan per proyek — dipulihkan saat kanvas dibuka kembali. */
export function loadArtboard(projectId: string): ArtboardState | null {
  if (!hasStorage()) return null;
  try {
    const raw = window.localStorage.getItem(artboardKey(projectId));
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (
      typeof parsed === "object" &&
      parsed !== null &&
      typeof (parsed as ArtboardState).width === "number" &&
      typeof (parsed as ArtboardState).height === "number"
    ) {
      const ab = parsed as ArtboardState;
      return {
        width: ab.width,
        height: ab.height,
        ...(typeof ab.backgroundColor === "string"
          ? { backgroundColor: ab.backgroundColor }
          : {}),
      };
    }
    return null;
  } catch {
    return null;
  }
}

export function saveArtboard(
  projectId: string,
  artboard: ArtboardState | null,
): void {
  if (!hasStorage()) return;
  try {
    if (artboard) {
      window.localStorage.setItem(artboardKey(projectId), JSON.stringify(artboard));
    } else {
      window.localStorage.removeItem(artboardKey(projectId));
    }
  } catch {
    /* abaikan */
  }
}

// --------------------------------------------------------------- objek

/**
 * Objek kanvas tersimpan per proyek — desain bertahan setelah reload,
 * termasuk mode offline (tanpa server kolaborasi). Saat kolaborasi aktif,
 * dokumen Y.js bersama tetap menjadi sumber kebenaran (lihat
 * CollabProvider.bindObjects); simpanan ini menjadi benih saat dokumen
 * bersama masih kosong.
 */
export function loadObjects(projectId: string): CanvasObject[] {
  if (!hasStorage()) return [];
  try {
    const raw = window.localStorage.getItem(objectsKey(projectId));
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (o): o is CanvasObject =>
        typeof o === "object" &&
        o !== null &&
        typeof (o as CanvasObject).id === "string" &&
        typeof (o as CanvasObject).type === "string" &&
        typeof (o as CanvasObject).x === "number" &&
        typeof (o as CanvasObject).y === "number",
    );
  } catch {
    return [];
  }
}

export function saveObjects(
  projectId: string,
  objects: readonly CanvasObject[],
): void {
  if (!hasStorage()) return;
  try {
    const json = JSON.stringify(objects);
    if (json.length > MAX_OBJECTS_JSON) {
      // Terlalu besar untuk localStorage — jangan menimpa simpanan lama
      // dengan kegagalan; sekadar catat agar terlihat saat debug.
      console.warn(
        `[Kvolve] Objek proyek ${projectId} melebihi batas simpan lokal (${Math.round(json.length / 1024)}KB) — tidak dipersistenkan.`,
      );
      return;
    }
    window.localStorage.setItem(objectsKey(projectId), json);
  } catch {
    /* kuota penuh — desain tetap hidup di sesi ini */
  }
}

// ------------------------------------------------------------------ util

/** Stempel waktu relatif berbahasa Indonesia untuk kartu proyek. */
export function timeAgo(ts: number): string {
  const s = Math.max(0, (Date.now() - ts) / 1000);
  if (s < 60) return "Baru saja";
  if (s < 3600) return `${Math.floor(s / 60)} mnt lalu`;
  if (s < 86400) return `${Math.floor(s / 3600)} jam lalu`;
  if (s < 7 * 86400) return `${Math.floor(s / 86400)} hari lalu`;
  return new Date(ts).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}
