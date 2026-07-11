"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useAuthUser } from "@/hooks/useAuthUser";
import { useComfort } from "@/lib/comfort/comfortStore";

/**
 * MobileBottomNav — dock navigasi bawah untuk layar sentuh ("AI-chat-first
 * mobile shell", fitur yang sempat ditunda). Dipasang sekali di root layout
 * dan menyaring rute sendiri (allowlist, bukan denylist) agar rute baru
 * di masa depan default TIDAK menampilkan dock ini kecuali didaftarkan
 * secara sadar. Hanya tampil di bawah 640px (`sm:hidden`) — desktop tetap
 * memakai nav atas seperti sekarang, nol perubahan visual di sana.
 *
 * Tab AI TIDAK memanggil state AiOrb secara langsung (dock ini dipasang di
 * root, sedangkan `aiOpen` dimiliki DashboardStudioHub) — dipakai
 * mekanisme handoff query-param yang sama persis dengan `?studio=` di
 * StudioCards -> InfiniteCanvas: push `/dashboard?ai=1`, DashboardStudioHub
 * membaca lalu membersihkan param itu saat mount.
 */
export function MobileBottomNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useAuthUser();
  const comfort = useComfort();

  const visible =
    pathname === "/dashboard" || pathname.startsWith("/profile/");
  if (!visible) return null;

  const profileHref = user ? "/profile/kahfi" : "/login";
  const isBeranda = pathname === "/dashboard";
  const isProfil = pathname.startsWith("/profile/");
  const skipMotion = comfort.reduceMotion || comfort.performanceMode;

  const openAi = (): void => {
    router.push("/dashboard?ai=1");
  };

  return (
    <nav
      aria-label="Navigasi utama"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-glass-border bg-glass shadow-float backdrop-blur-md sm:hidden"
      style={{ paddingBottom: "var(--kv-safe-b)" }}
    >
      <div className="mx-auto flex h-14 max-w-md items-center justify-around px-2">
        <Link
          href="/dashboard"
          aria-current={isBeranda ? "page" : undefined}
          className={`flex flex-1 flex-col items-center gap-0.5 py-1.5 text-[10px] font-medium transition-colors ${
            isBeranda ? "text-accent" : "text-ink-subtle"
          }`}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path
              d="M4 11L12 4l8 7M6 9.5V20h12V9.5"
              stroke="currentColor"
              strokeWidth="1.7"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          Beranda
          {isBeranda && !skipMotion && (
            <motion.span
              layoutId="kv-mobilenav-active"
              className="absolute bottom-0.5 h-1 w-1 rounded-full bg-accent"
              transition={{ duration: 0.2 }}
            />
          )}
        </Link>

        <button
          type="button"
          onClick={openAi}
          aria-label="Buka AI Studio"
          className="relative flex flex-1 flex-col items-center gap-0.5 py-1.5 text-[10px] font-semibold text-accent"
        >
          <span
            aria-hidden
            className="kv-cta -mt-6 grid h-11 w-11 place-items-center rounded-full shadow-glow transition-transform active:scale-95"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path
                d="M12 3L13.8 8.2L19 10L13.8 11.8L12 17L10.2 11.8L5 10L10.2 8.2L12 3Z"
                stroke="currentColor"
                strokeWidth="1.4"
                strokeLinejoin="round"
              />
            </svg>
          </span>
          AI Studio
        </button>

        <Link
          href={profileHref}
          aria-current={isProfil ? "page" : undefined}
          className={`flex flex-1 flex-col items-center gap-0.5 py-1.5 text-[10px] font-medium transition-colors ${
            isProfil ? "text-accent" : "text-ink-subtle"
          }`}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
            <circle cx="12" cy="8" r="3.4" stroke="currentColor" strokeWidth="1.7" />
            <path
              d="M5 20c1-3.8 4-6 7-6s6 2.2 7 6"
              stroke="currentColor"
              strokeWidth="1.7"
              strokeLinecap="round"
            />
          </svg>
          Profil
          {isProfil && !skipMotion && (
            <motion.span
              layoutId="kv-mobilenav-active"
              className="absolute bottom-0.5 h-1 w-1 rounded-full bg-accent"
              transition={{ duration: 0.2 }}
            />
          )}
        </Link>
      </div>
    </nav>
  );
}
