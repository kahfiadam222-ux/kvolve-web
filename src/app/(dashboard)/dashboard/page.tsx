import Link from "next/link";
import { KvolveMark } from "@/components/brand/KvolveMark";
import { ProjectGallery } from "@/components/dashboard/ProjectGallery";

/**
 * Workspace Dashboard (W-FR-1.2) — shell server component (SSR ringan,
 * NFR initial load < 2 detik); daftar + aksi buat/ganti nama/hapus proyek
 * hidup di ProjectGallery (client) karena datanya localStorage selama MVP.
 *
 * TODO(W-FR-1.1): setelah Supabase Auth aktif, ganti sumber data
 * localProjects dengan tabel `projects` (RLS per user).
 */
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
        <ProjectGallery />

        <p className="mt-12 text-xs text-stone-500">
          Tips: buka proyek yang sama di dua tab (dengan server kolaborasi
          menyala) untuk melihat kursor multiplayer bekerja.
        </p>
      </main>
    </div>
  );
}
