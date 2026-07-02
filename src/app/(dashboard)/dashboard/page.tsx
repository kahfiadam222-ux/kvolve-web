import Link from "next/link";

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
    <main className="mx-auto max-w-5xl px-6 py-14">
      <header className="flex items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">
            Kvolve
          </p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">
            Proyek kanvas
          </h1>
        </div>
        <button
          type="button"
          className="cursor-not-allowed rounded-full bg-ink px-4 py-2 text-sm font-medium text-white opacity-40"
          title="Menyusul: buat proyek baru via Supabase"
          disabled
        >
          Buat proyek
        </button>
      </header>

      <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {projects.map((p) => (
          <li key={p.id}>
            <Link
              href={`/canvas/${p.id}`}
              className="group block rounded-2xl border border-stone-200 bg-white p-5 transition-all hover:-translate-y-0.5 hover:border-accent/40 hover:shadow-lg hover:shadow-stone-900/5"
            >
              <div className="grid h-24 place-items-center rounded-xl bg-canvas text-3xl text-stone-300 transition-colors group-hover:text-accent/60">
                ⌗
              </div>
              <p className="mt-4 font-medium">{p.name}</p>
              <p className="mt-0.5 text-xs text-stone-500">
                Diubah {p.updatedAt}
              </p>
            </Link>
          </li>
        ))}
      </ul>

      <p className="mt-10 text-xs text-stone-400">
        Buka proyek yang sama di dua tab (dengan server kolaborasi menyala)
        untuk melihat kursor multiplayer bekerja.
      </p>
    </main>
  );
}
