import { KvolveMark } from "@/components/brand/KvolveMark";
import { LiquidBackdrop } from "@/components/brand/LiquidBackdrop";
import { UserBadge } from "@/components/auth/UserBadge";
import { ProjectGallery } from "@/components/dashboard/ProjectGallery";

/**
 * Workspace Dashboard (W-FR-1.2) — shell server component (SSR ringan,
 * NFR initial load < 2 detik); daftar + aksi buat/ganti nama/hapus proyek
 * hidup di ProjectGallery (client) karena datanya localStorage selama MVP.
 *
 * Shell aplikasi (dashboard/login/profil) memakai tema "liquid glass" —
 * lihat LiquidBackdrop & .glass-sheen di globals.css. Workspace kanvas
 * tetap gelap polos secara sengaja (konvensi tool desain profesional).
 *
 * TODO(W-FR-1.1): setelah Supabase Auth aktif, ganti sumber data
 * localProjects dengan tabel `projects` (RLS per user).
 */
export default function DashboardPage() {
  return (
    <div className="relative min-h-dvh text-ink">
      <LiquidBackdrop />

      <nav className="sticky top-0 z-10 border-b border-glass-border bg-canvas/60 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-6">
          <div className="flex items-center gap-2.5">
            <KvolveMark className="h-7 w-7" />
            <span className="text-[15px] font-semibold tracking-tight">
              Kvolve
            </span>
          </div>
          <UserBadge />
        </div>
      </nav>

      <main className="relative mx-auto max-w-6xl px-6 py-14">
        <ProjectGallery />

        <div className="mt-14 inline-flex items-center gap-2 rounded-full border border-glass-border bg-glass-soft px-4 py-2 text-xs text-stone-400 backdrop-blur-sm">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" aria-hidden className="shrink-0 text-accent">
            <path
              d="M12 21c4.5-3.5 7-6.9 7-10.5A7 7 0 0 0 5 10.5C5 14.1 7.5 17.5 12 21Z"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinejoin="round"
            />
            <circle cx="12" cy="10.5" r="2.4" stroke="currentColor" strokeWidth="1.6" />
          </svg>
          Tips: buka proyek yang sama di dua tab (dengan server kolaborasi
          menyala) untuk melihat kursor multiplayer bekerja.
        </div>
      </main>
    </div>
  );
}
