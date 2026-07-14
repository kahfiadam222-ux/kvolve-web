import {
  CUSTOM_THEME_ID,
  DEFAULT_THEME_ID,
  THEME_PRESETS,
  customThemeFallback,
  type KvTheme,
} from "./themeData";

/**
 * themeStore — persistensi & langganan tema aktif (pola localProjects.ts,
 * SENGAJA bukan zustand: store zustand di proyek ini khusus state kanvas).
 *
 * `kvolve:theme` menyimpan snapshot `{ id, dark, vars }` (bukan hanya id)
 * supaya skrip no-flash di layout.tsx bisa menempel variabel sebelum
 * hydration TANPA mengimpor katalog. `kvolve:theme-custom` menyimpan
 * definisi lengkap tema hasil generator (Phase 7).
 */

const THEME_KEY = "kvolve:theme";
const CUSTOM_KEY = "kvolve:theme-custom";

interface ThemeSnapshot {
  id: string;
  dark: boolean;
  vars: Record<string, string>;
}

const hasStorage = (): boolean =>
  typeof window !== "undefined" && !!window.localStorage;

// ------------------------------------------------------------ langganan

type Listener = () => void;
const listeners = new Set<Listener>();

function emit(): void {
  for (const l of listeners) l();
}

/** Panggil `cb` tiap tema berubah (tab ini maupun tab lain). */
export function subscribeTheme(cb: Listener): () => void {
  listeners.add(cb);
  const onStorage = (e: StorageEvent): void => {
    if (e.key === THEME_KEY || e.key === CUSTOM_KEY) cb();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(cb);
    window.removeEventListener("storage", onStorage);
  };
}

// ------------------------------------------------------------- resolve

export function getCustomTheme(): KvTheme {
  if (!hasStorage()) return customThemeFallback();
  try {
    const raw = window.localStorage.getItem(CUSTOM_KEY);
    if (!raw) return customThemeFallback();
    const parsed = JSON.parse(raw) as KvTheme;
    if (
      typeof parsed === "object" &&
      parsed !== null &&
      typeof parsed.id === "string" &&
      typeof parsed.vars === "object"
    ) {
      return { ...parsed, id: CUSTOM_THEME_ID, isCustom: true };
    }
    return customThemeFallback();
  } catch {
    return customThemeFallback();
  }
}

export function getActiveThemeId(): string {
  if (!hasStorage()) return DEFAULT_THEME_ID;
  try {
    const raw = window.localStorage.getItem(THEME_KEY);
    if (!raw) return DEFAULT_THEME_ID;
    const parsed = JSON.parse(raw) as ThemeSnapshot;
    return typeof parsed?.id === "string" ? parsed.id : DEFAULT_THEME_ID;
  } catch {
    return DEFAULT_THEME_ID;
  }
}

export function getActiveTheme(): KvTheme {
  const id = getActiveThemeId();
  if (id === CUSTOM_THEME_ID) return getCustomTheme();
  return (
    THEME_PRESETS.find((t) => t.id === id) ??
    THEME_PRESETS.find((t) => t.id === DEFAULT_THEME_ID)!
  );
}

// ---------------------------------------------------------------- tulis

function persistSnapshot(theme: KvTheme): void {
  if (!hasStorage()) return;
  try {
    const snap: ThemeSnapshot = { id: theme.id, dark: theme.dark, vars: theme.vars };
    window.localStorage.setItem(THEME_KEY, JSON.stringify(snap));
  } catch {
    /* kuota penuh/terblokir — tema tetap berlaku di sesi ini via emit() */
  }
  emit();
}

/** Aktifkan preset (atau slot custom) berdasarkan id. */
export function setActiveTheme(id: string): void {
  const theme =
    id === CUSTOM_THEME_ID
      ? getCustomTheme()
      : THEME_PRESETS.find((t) => t.id === id);
  if (!theme) return;
  persistSnapshot(theme);
}

/** Simpan tema hasil generator lalu langsung aktifkan. */
export function setCustomTheme(theme: KvTheme): void {
  if (hasStorage()) {
    try {
      window.localStorage.setItem(
        CUSTOM_KEY,
        JSON.stringify({ ...theme, id: CUSTOM_THEME_ID, isCustom: true }),
      );
    } catch {
      /* abaikan */
    }
  }
  persistSnapshot({ ...theme, id: CUSTOM_THEME_ID, isCustom: true });
}
