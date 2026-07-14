import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

/**
 * true bila kredensial Supabase terisi di .env.local. Saat false, aplikasi
 * berjalan penuh dalam "mode tamu" (lihat lib/auth/appUser.ts) dan tombol
 * OAuth dinonaktifkan dengan keterangan — TIDAK crash.
 */
export const isSupabaseConfigured = Boolean(url && anonKey);

/**
 * Klien Supabase untuk komponen 'use client' (login, aksi dashboard).
 * Mengembalikan null bila belum dikonfigurasi — dulu memanggil
 * createBrowserClient dengan string kosong yang langsung melempar error
 * begitu tombol login diklik.
 */
export function createBrowserSupabase(): SupabaseClient | null {
  if (!isSupabaseConfigured) return null;
  return createBrowserClient(url!, anonKey!);
}

/**
 * Upload file ke Supabase Storage bucket 'assets'.
 * Mengembalikan public URL bila berhasil, null bila gagal atau
 * Supabase tidak dikonfigurasi (mode tamu).
 */
export async function uploadToStorage(
  file: Blob,
  path: string,
): Promise<string | null> {
  const supabase = createBrowserSupabase();
  if (!supabase) return null;
  try {
    const { error } = await supabase.storage
      .from("assets")
      .upload(path, file, { upsert: true });
    if (error) {
      console.error("[Kvolve] Gagal upload ke Storage:", error.message);
      return null;
    }
    const { data } = supabase.storage.from("assets").getPublicUrl(path);
    return data.publicUrl;
  } catch (err) {
    console.error("[Kvolve] Error upload Storage:", err);
    return null;
  }
}

/**
 * Hapus file dari Supabase Storage (dipanggil saat objek dihapus).
 * Best-effort: tidak melempar error bila gagal.
 */
export async function deleteFromStorage(path: string): Promise<void> {
  const supabase = createBrowserSupabase();
  if (!supabase) return;
  try {
    await supabase.storage.from("assets").remove([path]);
  } catch {
    /* abaikan — cleanup best-effort */
  }
}
