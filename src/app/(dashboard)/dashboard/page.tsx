import { KvolveMark } from "@/components/brand/KvolveMark";
import { CrystalBackdrop } from "@/components/brand/CrystalBackdrop";
import { UserBadge } from "@/components/auth/UserBadge";
import { PersonalizationButton } from "@/components/theme/PersonalizationButton";
import { SettingsButton } from "@/components/settings/SettingsButton";
import { DashboardStudioHub } from "@/components/dashboard/DashboardStudioHub";
import { TemplateCenter } from "@/components/dashboard/TemplateCenter";
import { ProjectGallery } from "@/components/dashboard/ProjectGallery";

/**
 * Workspace Dashboard (W-FR-1.2) — "Creative Studio Hub" shell (server
 * component, SSR ringan; NFR initial load < 2 detik). Studio Desain dan
 * Template Center tampil langsung di beranda (bukan disembunyikan), lalu
 * daftar Proyek Terakhir di bawahnya.
 *
 * Shell aplikasi (dashboard/login/profil) memakai identitas "Crystal OS" —
 * lihat CrystalBackdrop & .crystal-panel di globals.css.
 *
 * TODO(W-FR-1.1): setelah Supabase Auth aktif, ganti sumber data
 * localProjects dengan tabel `projects` (RLS per user).
 */
export default function DashboardPage() {
  return (
    <div className="relative min-h-dvh text-ink">
      <CrystalBackdrop />

      <nav className="kv-hairline-b sticky top-0 z-10 border-b border-glass-border bg-canvas/60 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-5 sm:px-6">
          <div className="flex items-center gap-2.5">
            <KvolveMark className="h-7 w-7" />
            <span className="font-display text-base font-bold tracking-tight">
              Kvolve
            </span>
          </div>
          <div className="flex items-center gap-1.5 sm:gap-2">
            <PersonalizationButton />
            <SettingsButton />
            <UserBadge />
          </div>
        </div>
      </nav>

      {/* Ritme berkelompok: klaster studio (di dalam Hub) rapat, antar-zona
          longgar — bukan metronom space-y seragam. */}
      <main className="relative mx-auto max-w-6xl space-y-14 px-5 py-8 sm:space-y-20 sm:px-6 sm:py-12">
        <DashboardStudioHub />
        <TemplateCenter />
        <ProjectGallery />

        <div className="inline-flex items-start gap-2 rounded-2xl border border-glass-border bg-glass-soft px-4 py-2.5 text-xs leading-relaxed text-ink-subtle backdrop-blur-sm sm:items-center sm:rounded-full sm:py-2">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" aria-hidden className="mt-0.5 shrink-0 text-accent sm:mt-0">
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
