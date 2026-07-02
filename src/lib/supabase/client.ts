import { createBrowserClient } from "@supabase/ssr";

/** Klien Supabase untuk komponen 'use client' (login, aksi dashboard). */
export function createBrowserSupabase() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
