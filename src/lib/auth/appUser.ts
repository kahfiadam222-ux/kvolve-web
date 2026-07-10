/**
 * appUser — identitas pengguna aplikasi (W-FR-1.1).
 *
 * Dua sumber, satu bentuk:
 * 1. Sesi Supabase (bila .env.local terisi) — ditangani useAuthUser.
 * 2. Mode tamu (localStorage) — selalu tersedia, membuat auth "berfungsi"
 *    ujung-ke-ujung tanpa kredensial eksternal.
 *
 * Nama tampilan juga di-cache ke localStorage agar modul non-React
 * (identitas kursor CollabProvider) bisa membacanya secara sinkron.
 */

export interface AppUser {
  id: string;
  name: string;
  email?: string;
  guest: boolean;
}

const GUEST_KEY = "kvolve:guest";
const NAME_CACHE_KEY = "kvolve:display-name";

/** Event yang dipancarkan saat identitas tamu berubah (mis. ganti nickname
 *  dari menu Settings) — useAuthUser mendengarkannya agar UserBadge dkk.
 *  ikut segar tanpa reload. */
export const USER_CHANGED_EVENT = "kv:user-changed";

const hasStorage = (): boolean => typeof window !== "undefined";

export function getGuestUser(): AppUser | null {
  if (!hasStorage()) return null;
  try {
    const raw = window.localStorage.getItem(GUEST_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (
      typeof parsed === "object" &&
      parsed !== null &&
      typeof (parsed as AppUser).id === "string" &&
      typeof (parsed as AppUser).name === "string"
    ) {
      return { ...(parsed as AppUser), guest: true };
    }
    return null;
  } catch {
    return null;
  }
}

export function signInAsGuest(name: string): AppUser {
  const clean = name.trim() || "Tamu Kvolve";
  const user: AppUser = {
    id: `guest-${Math.random().toString(36).slice(2, 10)}`,
    name: clean.slice(0, 40),
    guest: true,
  };
  if (hasStorage()) {
    try {
      window.localStorage.setItem(GUEST_KEY, JSON.stringify(user));
    } catch {
      /* storage penuh: sesi tamu tetap jalan in-memory */
    }
  }
  cacheDisplayName(user.name);
  return user;
}

/**
 * Ganti nickname tamu TANPA mengganti id (berbeda dengan signInAsGuest yang
 * membuat identitas baru) — riwayat kursor kolaborasi tetap milik orang
 * yang sama. No-op bila tidak ada sesi tamu.
 */
export function renameGuestUser(name: string): AppUser | null {
  const current = getGuestUser();
  if (!current) return null;
  const clean = name.trim();
  if (!clean) return current;
  const user: AppUser = { ...current, name: clean.slice(0, 40) };
  if (hasStorage()) {
    try {
      window.localStorage.setItem(GUEST_KEY, JSON.stringify(user));
    } catch {
      /* storage penuh: perubahan tetap berlaku in-memory */
    }
    window.dispatchEvent(new Event(USER_CHANGED_EVENT));
  }
  cacheDisplayName(user.name);
  return user;
}

export function signOutGuest(): void {
  if (!hasStorage()) return;
  try {
    window.localStorage.removeItem(GUEST_KEY);
    window.localStorage.removeItem(NAME_CACHE_KEY);
  } catch {
    /* abaikan */
  }
}

/** Cache nama tampilan untuk konsumen sinkron (kursor multiplayer). */
export function cacheDisplayName(name: string): void {
  if (!hasStorage()) return;
  try {
    window.localStorage.setItem(NAME_CACHE_KEY, name);
  } catch {
    /* abaikan */
  }
}

export function getCachedDisplayName(): string | null {
  if (!hasStorage()) return null;
  try {
    return window.localStorage.getItem(NAME_CACHE_KEY);
  } catch {
    return null;
  }
}
