"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { KvolveMark } from "@/components/brand/KvolveMark";
import { LiquidBackdrop } from "@/components/brand/LiquidBackdrop";
import { useAuthUser } from "@/hooks/useAuthUser";
import {
  activeStories,
  getProfile,
  isFollowing,
  toggleFollow,
  type UserProfile,
} from "@/lib/profile/profileData";
import { VerifiedBadge } from "./icons";
import { SocialLinks } from "./SocialLinks";
import { StoryBar } from "./StoryBar";
import { FeaturedProjects } from "./FeaturedProjects";

/**
 * ProfileView (PRD Addendum 03) — orkestrator panel profil.
 *
 * Client component agar bisa membaca proyek lokal (Featured), status follow
 * (localStorage), dan menyaring story yang masih aktif (< 24 jam) dengan
 * waktu klien. TERISOLASI dari editor kanvas: tidak mengimpor useCanvasStore.
 *
 * Kerangka data profil diturunkan sekali di klien (setelah mount) untuk
 * menghindari mismatch hydrasi antara waktu server & klien pada story TTL.
 */
export function ProfileView({ username }: { username: string }) {
  const { user, signOut } = useAuthUser();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [following, setFollowing] = useState(false);

  useEffect(() => {
    setProfile(getProfile(username));
    setFollowing(isFollowing(username));
  }, [username]);

  const stories = useMemo(
    () => (profile ? activeStories(profile.stories) : []),
    [profile],
  );

  const onToggleFollow = (): void => setFollowing(toggleFollow(username));

  return (
    <div className="relative min-h-dvh text-ink">
      <LiquidBackdrop />

      <nav className="sticky top-0 z-10 border-b border-glass-border bg-canvas/60 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-3xl items-center justify-between px-6">
          <Link href="/dashboard" className="flex items-center gap-2.5">
            <KvolveMark className="h-7 w-7" />
            <span className="text-[15px] font-semibold tracking-tight">Kvolve</span>
          </Link>
          <div className="flex items-center gap-2">
            <Link
              href="/dashboard"
              className="rounded-full border border-glass-border bg-glass-soft px-3 py-1.5 text-xs text-stone-300 transition-colors hover:bg-white/10 hover:text-ink"
            >
              ← Dasbor
            </Link>
            {user && (
              <button
                type="button"
                onClick={() => void signOut()}
                title={`Keluar dari sesi ${user.name}${user.guest ? " (Tamu)" : ""}`}
                className="rounded-full border border-glass-border bg-glass-soft px-3 py-1.5 text-xs text-stone-400 transition-colors hover:border-rose-400/40 hover:text-rose-300"
              >
                Keluar
              </button>
            )}
          </div>
        </div>
      </nav>

      <main className="relative mx-auto max-w-3xl px-6 py-8">
        {profile === null ? (
          <ProfileSkeleton />
        ) : (
          <div className="animate-fade-up space-y-8">
            {/* --- Story bubbles (atas profil, PRD 3) --- */}
            {stories.length > 0 && (
              <div className="glass-sheen rounded-2xl border border-glass-border bg-glass-soft p-4 backdrop-blur-sm">
                <StoryBar profile={profile} stories={stories} />
              </div>
            )}

            {/* --- Header profil: cover band warna berbaur + avatar overlap --- */}
            <header className="glass-sheen overflow-hidden rounded-3xl border border-glass-border bg-glass shadow-float backdrop-blur-xl backdrop-saturate-150">
              <div
                className="h-24 sm:h-28"
                style={{
                  background:
                    "linear-gradient(120deg,#fbbf24 0%,#f97316 55%,#ea580c 100%)",
                }}
              />

              <div className="px-6 pb-6">
                <div className="flex flex-wrap items-end gap-5">
                  <span
                    className="-mt-10 grid h-20 w-20 shrink-0 place-items-center rounded-2xl text-2xl font-bold text-white shadow-float ring-4 ring-canvas"
                    style={{ background: profile.avatarGradient }}
                  >
                    {profile.initials}
                  </span>

                  <div className="min-w-0 flex-1 pt-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h1 className="text-xl font-semibold tracking-tight">{profile.name}</h1>
                      {profile.verified && <VerifiedBadge className="h-5 w-5" />}
                      <span className="text-sm text-stone-500">@{profile.username}</span>
                    </div>
                  </div>
                </div>

                <p className="mt-4 max-w-prose text-sm leading-relaxed text-stone-300">
                  {profile.bio}
                </p>

                <div className="mt-4">
                  <SocialLinks socials={profile.socials} />
                </div>

                {/* Statistik sosial + Follow/Unfollow */}
                <div className="mt-6 flex flex-wrap items-center gap-6 border-t border-glass-border pt-4">
                  <Stat value={profile.followers + (following ? 1 : 0)} label="Pengikut" />
                  <Stat value={profile.following} label="Mengikuti" />
                  <button
                    type="button"
                    onClick={onToggleFollow}
                    aria-pressed={following}
                    className={`ml-auto rounded-full px-5 py-2 text-sm font-semibold transition-all active:scale-[0.98] ${
                      following
                        ? "border border-glass-border bg-glass-soft text-stone-300 hover:border-rose-400/40 hover:text-rose-300"
                        : "bg-gradient-to-r from-amber-400 via-orange-500 to-red-500 text-orange-950 shadow-card hover:shadow-glow"
                    }`}
                  >
                    {following ? "Mengikuti ✓" : "Ikuti"}
                  </button>
                </div>
              </div>
            </header>

            {/* --- Featured Projects (PRD 2) --- */}
            <FeaturedProjects projects={profile.featured} />
          </div>
        )}
      </main>
    </div>
  );
}

function Stat({ value, label }: { value: number; label: string }) {
  return (
    <div>
      <p className="text-lg font-semibold tabular-nums">{value.toLocaleString("id-ID")}</p>
      <p className="text-xs text-stone-500">{label}</p>
    </div>
  );
}

function ProfileSkeleton() {
  return (
    <div className="space-y-8">
      <div className="bg-shimmer h-24 rounded-2xl border border-glass-border bg-glass-soft" />
      <div className="bg-shimmer h-56 rounded-3xl border border-glass-border bg-glass-soft" />
    </div>
  );
}
