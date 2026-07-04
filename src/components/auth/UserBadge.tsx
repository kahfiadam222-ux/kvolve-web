"use client";

import Link from "next/link";
import { useAuthUser } from "@/hooks/useAuthUser";

/**
 * UserBadge — avatar pengguna di nav dashboard. Menampilkan inisial nama
 * (sesi Supabase atau tamu); tanpa identitas, mengarahkan ke /login.
 */
export function UserBadge() {
  const { user, loading } = useAuthUser();

  if (loading) {
    return (
      <span className="h-8 w-8 animate-pulse rounded-full bg-canvas-soft" aria-hidden />
    );
  }

  const initial = (user?.name?.trim()[0] ?? "?").toUpperCase();

  return (
    <Link
      href={user ? "/profile/kahfi" : "/login"}
      title={user ? `${user.name}${user.guest ? " (Tamu)" : ""} — lihat profil` : "Masuk"}
      className="grid h-8 w-8 place-items-center rounded-full bg-gradient-to-br from-blue-500 to-accent text-xs font-bold text-white shadow-sm ring-2 ring-white/40 transition-transform hover:scale-105"
    >
      {user ? initial : "→"}
    </Link>
  );
}
