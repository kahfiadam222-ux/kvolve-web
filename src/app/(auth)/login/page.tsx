"use client";

import { useState } from "react";
import { createBrowserSupabase } from "@/lib/supabase/client";

/**
 * W-FR-1.1 — OAuth & Auth System (Supabase Auth).
 * Skeleton fungsional: Google, GitHub, dan magic link email.
 *
 * Prasyarat di dashboard Supabase:
 * 1. Aktifkan provider Google & GitHub (isi client ID/secret).
 * 2. Tambahkan `${origin}/dashboard` ke daftar Redirect URLs.
 */
export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<string | null>(null);

  const signInWith = async (provider: "google" | "github") => {
    const supabase = createBrowserSupabase();
    await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: `${location.origin}/dashboard` },
    });
  };

  const signInWithEmail = async () => {
    if (!email) return;
    const supabase = createBrowserSupabase();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${location.origin}/dashboard` },
    });
    setStatus(
      error
        ? `Gagal mengirim tautan: ${error.message}`
        : "Tautan masuk sudah dikirim. Periksa email Anda.",
    );
  };

  return (
    <main className="grid min-h-dvh place-items-center px-6">
      <div className="w-full max-w-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">
          Kvolve
        </p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">
          Masuk ke ruang kerja
        </h1>

        <div className="mt-8 space-y-2">
          <button
            type="button"
            onClick={() => signInWith("google")}
            className="w-full rounded-xl border border-stone-200 bg-white py-2.5 text-sm font-medium transition-colors hover:border-stone-300 hover:bg-stone-50"
          >
            Lanjutkan dengan Google
          </button>
          <button
            type="button"
            onClick={() => signInWith("github")}
            className="w-full rounded-xl border border-stone-200 bg-white py-2.5 text-sm font-medium transition-colors hover:border-stone-300 hover:bg-stone-50"
          >
            Lanjutkan dengan GitHub
          </button>
        </div>

        <div className="my-6 flex items-center gap-3 text-xs text-stone-400">
          <span className="h-px flex-1 bg-stone-200" />
          atau lewat email
          <span className="h-px flex-1 bg-stone-200" />
        </div>

        <div className="flex gap-2">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="nama@perusahaan.com"
            className="min-w-0 flex-1 rounded-xl border border-stone-200 bg-white px-3 py-2.5 text-sm outline-none transition-colors placeholder:text-stone-400 focus:border-accent"
          />
          <button
            type="button"
            onClick={signInWithEmail}
            className="rounded-xl bg-ink px-4 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90"
          >
            Kirim tautan
          </button>
        </div>

        {status && <p className="mt-3 text-xs text-stone-500">{status}</p>}
      </div>
    </main>
  );
}
