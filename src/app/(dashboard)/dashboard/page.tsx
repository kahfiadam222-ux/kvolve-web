import Link from "next/link";
import { KvolveMark } from "@/components/brand/KvolveMark";

/**
 * Workspace Dashboard (W-FR-1.2) — server component agar termuat cepat
 * lewat SSR (NFR: initial load < 2 detik untuk data non-canvas).
 *
 * TODO: ganti data statis di bawah dengan query tabel `projects` Supabase
 * (RLS per user) + aksi buat/ganti nama/hapus proyek.
 */
const projects = [
  { id: "demo-project", name: "Kanvas Demo", updatedAt: "Baru saja" },
];

export default function DashboardPage() {
  return (
    <div className="min-h-dvh">
      <nav className="sticky top-0 z-10 border-b border-glass-border bg-canvas/70 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-6">
          <div className="flex items-center gap-2.5">
            <KvolveMark className="h-7 w-7" />
            <span className="text-[15px] font-semibold tracking-tight">
              Kvolve
            </span>
          </div>
          <Link
            href="/login"
            title="Masuk / kelola akun"
            className="grid h-8 w-8 place-items-center rounded-full bg-gradient-to-br from-teal-500 to-teal-700 text-xs font-bold text-white ring-2 ring-white/20 transition-transform hover:scale-105"
          >
            K
          </Link>
        </div>
      </nav>

      <main className="mx-auto max-w-5xl px-6 py-12">
        <header className="flex flex-wrap items-end justify-between gap-4 animate-fade-up">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              Proyek kanvas
            </h1>
            <p className="mt-1 text-sm text-stone-400">
              {projects.length} proyek · tersimpan lokal selama MVP
            </p>
          </div>
          <button
            type="button"
            className="inline-flex cursor-not-allowed items-center gap-2 rounded-full bg-accent px-4 py-2 text-sm font-semibold text-teal-950 opacity-40"
            title="Menyusul: buat proyek baru via Supabase"
            disabled
          >
            <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden>
              <path
                d="M7 2v10M2 7h10"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
              />
            </svg>
            Buat proyek
          </button>
        </header>

        <ul className="mt-10 grid gap-4 animate-fade-up sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((p) => (
            <li key={p.id}>
              <Link
                href={`/canvas/${p.id}`}
                className="group block rounded-2xl border border-glass-border bg-glass-soft p-4 backdrop-blur-sm transition-all duration-200 hover:-translate-y-1 hover:border-accent/40 hover:bg-white/[0.08] hover:shadow-float"
              >
                {/* Thumbnail: miniatur suasana kanvas (grid titik + objek). */}
                <div className="bg-dotgrid relative h-28 overflow-hidden rounded-xl border border-white/[0.06] bg-black/20">
                  <span className="absolute left-6 top-5 h-10 w-16 rounded-md bg-accent/20 ring-1 ring-accent/30 transition-transform duration-300 group-hover:-translate-y-0.5" />
                  <span className="absolute left-16 top-10 h-12 w-20 rounded-md bg-white/10 ring-1 ring-white/15 transition-transform duration-300 group-hover:translate-x-1" />
                  <span className="absolute right-6 top-6 h-8 w-8 rounded-full bg-rose-400/20 ring-1 ring-rose-400/30 transition-transform duration-300 group-hover:translate-y-0.5" />
                </div>

                <div className="mt-4 flex items-center justify-between px-0.5">
                  <div>
                    <p className="font-medium">{p.name}</p>
                    <p className="mt-0.5 text-xs text-stone-400">
                      Diubah {p.updatedAt}
                    </p>
                  </div>
                  <span
                    aria-hidden
                    className="text-stone-500 opacity-0 transition-all duration-200 group-hover:translate-x-0.5 group-hover:text-accent group-hover:opacity-100"
                  >
                    →
                  </span>
                </div>
              </Link>
            </li>
          ))}

          <li>
            <div
              aria-disabled
              title="Menyusul: buat proyek baru via Supabase"
              className="grid h-full min-h-[190px] cursor-not-allowed place-items-center rounded-2xl border-2 border-dashed border-white/10 text-stone-500 transition-colors hover:border-white/20"
            >
              <div className="text-center">
                <p className="text-2xl font-light">+</p>
                <p className="mt-1 text-sm">Proyek baru</p>
                <p className="mt-0.5 text-xs text-stone-600">
                  menyusul bersama Supabase
                </p>
              </div>
            </div>
          </li>
        </ul>

        <p className="mt-12 text-xs text-stone-500">
          Tips: buka proyek yang sama di dua tab (dengan server kolaborasi
          menyala) untuk melihat kursor multiplayer bekerja.
        </p>
      </main>
    </div>
  );
}
