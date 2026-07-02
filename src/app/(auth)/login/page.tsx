"use client";

import { useState } from "react";
import { KvolveMark } from "@/components/brand/KvolveMark";
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
  const [sending, setSending] = useState(false);
  const [status, setStatus] = useState<{ ok: boolean; msg: string } | null>(
    null,
  );

  const signInWith = async (provider: "google" | "github") => {
    const supabase = createBrowserSupabase();
    await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: `${location.origin}/dashboard` },
    });
  };

  const signInWithEmail = async () => {
    if (!email || sending) return;
    setSending(true);
    setStatus(null);
    try {
      const supabase = createBrowserSupabase();
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: { emailRedirectTo: `${location.origin}/dashboard` },
      });
      setStatus(
        error
          ? { ok: false, msg: `Gagal mengirim tautan: ${error.message}` }
          : { ok: true, msg: "Tautan masuk sudah dikirim. Periksa email Anda." },
      );
    } finally {
      setSending(false);
    }
  };

  const providerBtn =
    "inline-flex w-full items-center justify-center gap-2.5 rounded-xl border border-glass-border bg-glass-soft py-2.5 text-sm font-medium text-ink transition-all hover:border-white/20 hover:bg-white/10 active:scale-[0.99]";

  return (
    <main className="bg-dotgrid grid min-h-dvh place-items-center px-6">
      <div className="w-full max-w-sm animate-fade-up">
        <div className="rounded-3xl border border-glass-border bg-glass p-8 shadow-float backdrop-blur-xl">
          <KvolveMark className="h-9 w-9" />
          <h1 className="mt-5 text-xl font-semibold tracking-tight">
            Masuk ke ruang kerja
          </h1>
          <p className="mt-1 text-sm leading-relaxed text-stone-400">
            Satu kanvas tak terbatas untuk desain, PDF, dan layout HTML.
          </p>

          <div className="mt-7 space-y-2">
            <button
              type="button"
              onClick={() => signInWith("google")}
              className={providerBtn}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden>
                <path
                  d="M23.5 12.27c0-.85-.08-1.66-.22-2.45H12v4.64h6.45a5.52 5.52 0 0 1-2.4 3.62v3h3.87c2.27-2.09 3.58-5.17 3.58-8.81Z"
                  fill="#4285F4"
                />
                <path
                  d="M12 24c3.24 0 5.96-1.07 7.94-2.91l-3.87-3c-1.08.72-2.45 1.15-4.07 1.15-3.13 0-5.78-2.11-6.73-4.96H1.29v3.1A12 12 0 0 0 12 24Z"
                  fill="#34A853"
                />
                <path
                  d="M5.27 14.28a7.2 7.2 0 0 1 0-4.56v-3.1H1.29a12 12 0 0 0 0 10.76l3.98-3.1Z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 4.76c1.76 0 3.35.6 4.6 1.8l3.44-3.44A11.98 11.98 0 0 0 1.3 6.62l3.98 3.1c.94-2.85 3.6-4.96 6.73-4.96Z"
                  fill="#EA4335"
                />
              </svg>
              Lanjutkan dengan Google
            </button>
            <button
              type="button"
              onClick={() => signInWith("github")}
              className={providerBtn}
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                aria-hidden
                fill="currentColor"
              >
                <path d="M12 .5A11.5 11.5 0 0 0 .5 12c0 5.08 3.29 9.39 7.86 10.91.58.11.79-.25.79-.55v-2.15c-3.2.7-3.87-1.36-3.87-1.36-.52-1.33-1.28-1.68-1.28-1.68-1.04-.72.08-.7.08-.7 1.15.08 1.76 1.18 1.76 1.18 1.03 1.76 2.7 1.25 3.35.96.1-.75.4-1.26.72-1.55-2.55-.29-5.24-1.28-5.24-5.68 0-1.26.45-2.28 1.18-3.09-.12-.29-.51-1.46.11-3.05 0 0 .97-.31 3.16 1.18a11 11 0 0 1 5.76 0c2.19-1.49 3.15-1.18 3.15-1.18.63 1.59.24 2.76.12 3.05.74.81 1.18 1.83 1.18 3.09 0 4.41-2.69 5.38-5.26 5.66.41.36.78 1.05.78 2.12v3.14c0 .3.2.67.8.55A11.5 11.5 0 0 0 23.5 12 11.5 11.5 0 0 0 12 .5Z" />
              </svg>
              Lanjutkan dengan GitHub
            </button>
          </div>

          <div className="my-6 flex items-center gap-3 text-xs text-stone-500">
            <span className="h-px flex-1 bg-white/10" />
            atau lewat email
            <span className="h-px flex-1 bg-white/10" />
          </div>

          <div className="flex gap-2">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && void signInWithEmail()}
              placeholder="nama@perusahaan.com"
              className="min-w-0 flex-1 rounded-xl border border-glass-border bg-black/25 px-3 py-2.5 text-sm text-ink outline-none transition-all placeholder:text-stone-500 focus:border-accent/60 focus:ring-2 focus:ring-accent/20"
            />
            <button
              type="button"
              onClick={() => void signInWithEmail()}
              disabled={sending || !email}
              className="rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-teal-950 transition-all hover:opacity-90 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-35"
            >
              {sending ? "Mengirim…" : "Kirim tautan"}
            </button>
          </div>

          {status && (
            <p
              className={`mt-3 rounded-lg px-3 py-2 text-xs ${
                status.ok
                  ? "bg-accent-soft text-accent"
                  : "bg-rose-500/10 text-rose-300"
              }`}
            >
              {status.msg}
            </p>
          )}
        </div>

        <p className="mt-5 text-center text-xs text-stone-500">
          Dengan masuk, Anda menyetujui Ketentuan Layanan Kvolve.
        </p>
      </div>
    </main>
  );
}
