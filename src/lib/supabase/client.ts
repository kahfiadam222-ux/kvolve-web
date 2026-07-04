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
