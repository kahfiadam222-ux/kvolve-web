"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { KvolveMark } from "@/components/brand/KvolveMark";
import { LiquidBackdrop } from "@/components/brand/LiquidBackdrop";
import { getGuestUser, signInAsGuest } from "@/lib/auth/appUser";
import {
  createBrowserSupabase,
  isSupabaseConfigured,
} from "@/lib/supabase/client";

/**
 * W-FR-1.1 — OAuth & Auth System (Supabase Auth) + Mode Tamu.
 *
 * - Supabase terkonfigurasi: Google, GitHub, magic link email — semuanya aktif.
 * - Belum terkonfigurasi: tombol OAuth dinonaktifkan dengan keterangan
 *   (dulu malah crash saat diklik), dan Mode Tamu menjadi jalur utama
 *   sehingga aplikasi tetap bisa dipakai penuh.
 *
 * Tata letak dua-kolom (branding + form) di layar lebar; branding menyusut
 * jadi header ringkas di mobile. Latar liquid-glass sama dengan shell lain.
 *
 * Prasyarat di dashboard Supabase:
 * 1. Aktifkan provider Google & GitHub (isi client ID/secret).
 * 2. Tambahkan `${origin}/dashboard` ke daftar Redirect URLs.
 */

const FEATURES = [
  {
    title: "Kanvas tak terbatas",
    desc: "Pan & zoom mulus untuk gambar, PDF, dan layout HTML.",
    icon: (
      <path
        d="M4 8h4v8H4zM10 4h4v16h-4zM16 10h4v4h-4z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
        fill="none"
      />
    ),
  },
  {
    title: "Anotasi PDF langsung",
    desc: "Render halaman PDF asli lalu ketik ulang teksnya di kanvas.",
    icon: (
      <path
        d="M7 3h7l4 4v14H7zM14 3v4h4M9 15h6M9 12h6"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
        fill="none"
      />
    ),
  },
  {
    title: "Kolaborasi real-time",
    desc: "Kursor multiplayer & sinkronisasi objek lewat CRDT Y.js.",
    icon: (
      <path
        d="M8 12a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM16 12a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM3 20c0-3 2.5-5 5-5s5 2 5 5M11 20c0-3 2.5-5 5-5s5 2 5 5"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    ),
  },
];

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [guestName, setGuestName] = useState("");
  const [sending, setSending] = useState(false);
  const [existingGuest, setExistingGuest] = useState<string | null>(null);
  const [status, setStatus] = useState<{ ok: boolean; msg: string } | null>(
    null,
  );

  useEffect(() => {
    setExistingGuest(getGuestUser()?.name ?? null);
  }, []);

  const signInWith = async (provider: "google" | "github") => {
    const supabase = createBrowserSupabase();
    if (!supabase) return; // tombol sudah disabled; guard ekstra
    setStatus(null);
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: `${location.origin}/dashboard` },
    });
    if (error) setStatus({ ok: false, msg: `Gagal masuk: ${error.message}` });
  };

  const signInWithEmail = async () => {
    if (!email || sending) return;
    const supabase = createBrowserSupabase();
    if (!supabase) return;
    setSending(true);
    setStatus(null);
    try {
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

  const enterAsGuest = (): void => {
    signInAsGuest(guestName || existingGuest || "Tamu Kvolve");
    router.push("/dashboard");
  };

  const providerBtn =
    "inline-flex w-full items-center justify-center gap-2.5 rounded-xl border border-glass-border bg-glass-soft py-2.5 text-sm font-medium text-ink transition-all hover:border-white/20 hover:bg-white/10 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-35 disabled:hover:border-glass-border disabled:hover:bg-glass-soft";

  return (
    <main className="relative grid min-h-dvh place-items-center px-6 py-10 text-ink">
      <LiquidBackdrop />

      <div className="glass-sheen relative grid w-full max-w-4xl animate-fade-up overflow-hidden rounded-3xl border border-glass-border bg-glass shadow-float backdrop-blur-xl backdrop-saturate-150 lg:grid-cols-2">
        {/* ------------------------------------------------ Panel branding */}
        <div className="relative flex flex-col justify-between gap-8 border-b border-glass-border bg-black/10 p-8 lg:border-b-0 lg:border-r lg:p-10">
          <div>
            <KvolveMark className="h-10 w-10" />
            <h1 className="mt-6 text-2xl font-semibold tracking-tight sm:text-3xl">
              Satu kanvas, <span className="text-gradient">tanpa batas</span>
            </h1>
            <p className="mt-3 max-w-xs text-sm leading-relaxed text-stone-400">
              Desain, PDF, dan layout HTML berbaur dalam satu ruang kerja
              kolaboratif — seperti warna yang membaur di air.
            </p>
          </div>

          <ul className="space-y-4">
            {FEATURES.map((f) => (
              <li key={f.title} className="flex items-start gap-3">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-accent-soft text-accent">
                  <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden>
                    {f.icon}
                  </svg>
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-ink">{f.title}</p>
                  <p className="mt-0.5 text-xs leading-relaxed text-stone-400">
                    {f.desc}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        {/* ------------------------------------------------ Panel form */}
        <div className="p-8 lg:p-10">
          <h2 className="text-lg font-semibold tracking-tight">
            Masuk ke ruang kerja
          </h2>
          <p className="mt-1 text-sm text-stone-400">
            Coba tanpa akun, atau masuk dengan email/sosial media.
          </p>

          {/* ------------------------------------------------ Mode Tamu */}
          <div className="mt-6">
            <label className="text-xs text-stone-400">
              Nama tampilan (untuk kursor kolaborasi)
              <input
                type="text"
                value={guestName}
                onChange={(e) => setGuestName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && enterAsGuest()}
                placeholder={existingGuest ?? "mis. Kahfi"}
                maxLength={40}
                className="mt-1.5 w-full rounded-xl border border-glass-border bg-black/25 px-3 py-2.5 text-sm text-ink outline-none transition-all placeholder:text-stone-500 focus:border-accent/60 focus:ring-2 focus:ring-accent/20"
              />
            </label>
            <button
              type="button"
              onClick={enterAsGuest}
              className="mt-3 w-full rounded-xl bg-gradient-to-r from-amber-400 via-orange-500 to-red-500 px-4 py-2.5 text-sm font-semibold text-white shadow-card transition-all hover:shadow-glow active:scale-[0.98]"
            >
              {existingGuest && !guestName
                ? `Lanjut sebagai ${existingGuest}`
                : "Masuk sebagai Tamu"}
            </button>
          </div>

          <div className="my-6 flex items-center gap-3 text-xs text-stone-500">
            <span className="h-px flex-1 bg-white/10" />
            atau dengan akun
            <span className="h-px flex-1 bg-white/10" />
          </div>

          {/* ------------------------------------------------ OAuth */}
          <div className="space-y-2">
            <button
              type="button"
              onClick={() => signInWith("google")}
              disabled={!isSupabaseConfigured}
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
              disabled={!isSupabaseConfigured}
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

            <div className="flex gap-2 pt-1">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && void signInWithEmail()}
                placeholder="nama@perusahaan.com"
                disabled={!isSupabaseConfigured}
                className="min-w-0 flex-1 rounded-xl border border-glass-border bg-black/25 px-3 py-2.5 text-sm text-ink outline-none transition-all placeholder:text-stone-500 focus:border-accent/60 focus:ring-2 focus:ring-accent/20 disabled:cursor-not-allowed disabled:opacity-35"
              />
              <button
                type="button"
                onClick={() => void signInWithEmail()}
                disabled={!isSupabaseConfigured || sending || !email}
                className="rounded-xl border border-glass-border bg-glass-soft px-4 py-2.5 text-sm font-semibold text-ink transition-all hover:bg-white/10 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-35"
              >
                {sending ? "Mengirim…" : "Kirim tautan"}
              </button>
            </div>
          </div>

          {!isSupabaseConfigured && (
            <p className="mt-3 rounded-lg bg-white/[0.04] px-3 py-2 text-[11px] leading-relaxed text-stone-500">
              Login akun belum aktif — isi{" "}
              <code className="text-stone-400">NEXT_PUBLIC_SUPABASE_URL</code>{" "}
              &{" "}
              <code className="text-stone-400">
                NEXT_PUBLIC_SUPABASE_ANON_KEY
              </code>{" "}
              di <code className="text-stone-400">.env.local</code> untuk
              mengaktifkan Google/GitHub/email.
            </p>
          )}

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

          <p className="mt-5 text-center text-xs text-stone-500">
            Dengan masuk, Anda menyetujui Ketentuan Layanan Kvolve.
          </p>
        </div>
      </div>
    </main>
  );
}
