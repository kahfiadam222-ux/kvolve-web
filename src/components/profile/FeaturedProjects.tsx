import Link from "next/link";
import type { FeaturedProject } from "@/lib/profile/profileData";

/**
 * Featured Projects Showcase (PRD 2) — grid proyek sorotan yang disematkan
 * (maks 5). Tiap kartu: thumbnail mini, nama, keterangan, dan seluruh kartu
 * adalah tautan sekali-klik untuk membuka kanvas proyek tersebut.
 */
export function FeaturedProjects({ projects }: { projects: FeaturedProject[] }) {
  return (
    <section>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-ink">Proyek Sorotan</h2>
        <span className="text-xs text-stone-500">{projects.length} disematkan</span>
      </div>

      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {projects.map((p) => (
          <li key={p.id}>
            <Link
              href={`/canvas/${p.id}`}
              className="group block overflow-hidden rounded-2xl border border-glass-border bg-glass-soft backdrop-blur-sm transition-all duration-200 hover:-translate-y-1 hover:border-accent/40 hover:shadow-float"
            >
              <div
                className="bg-dotgrid relative h-24 border-b border-white/[0.06]"
                style={{ background: p.gradient }}
              >
                <span className="absolute right-2 top-2 grid h-6 w-6 place-items-center rounded-full bg-black/30 text-white/80 opacity-0 backdrop-blur-sm transition-opacity group-hover:opacity-100">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden>
                    <path
                      d="M7 17 17 7M9 7h8v8"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </span>
              </div>
              <div className="p-3">
                <p className="truncate text-sm font-medium">{p.name}</p>
                <p className="mt-0.5 truncate text-[11px] text-stone-400">{p.meta}</p>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
