"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  USER_CHANGED_EVENT,
  cacheDisplayName,
  getGuestUser,
  signOutGuest,
  type AppUser,
} from "@/lib/auth/appUser";
import {
  createBrowserSupabase,
  isSupabaseConfigured,
} from "@/lib/supabase/client";

/**
 * useAuthUser (W-FR-1.1) — satu sumber kebenaran identitas di sisi klien.
 *
 * - Supabase terkonfigurasi: baca sesi + ikuti onAuthStateChange.
 * - Selalu: fallback ke mode tamu (localStorage) bila tidak ada sesi.
 * - signOut menutup keduanya lalu mengarahkan ke /login.
 */
export function useAuthUser() {
  const router = useRouter();
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  // Identitas tamu bisa berubah dari Settings (rename) — ikuti event-nya
  // supaya setiap konsumen (UserBadge, profil) segar tanpa reload.
  useEffect(() => {
    const refresh = (): void => {
      setUser((u) => (u === null || u.guest ? getGuestUser() : u));
    };
    window.addEventListener(USER_CHANGED_EVENT, refresh);
    return () => window.removeEventListener(USER_CHANGED_EVENT, refresh);
  }, []);

  useEffect(() => {
    let alive = true;

    if (!isSupabaseConfigured) {
      setUser(getGuestUser());
      setLoading(false);
      return;
    }

    const supabase = createBrowserSupabase();
    if (!supabase) {
      setUser(getGuestUser());
      setLoading(false);
      return;
    }

    const apply = (sessionUser: {
      id: string;
      email?: string;
      user_metadata?: Record<string, unknown>;
    } | null): void => {
      if (!alive) return;
      if (sessionUser) {
        const name =
          (typeof sessionUser.user_metadata?.full_name === "string" &&
            sessionUser.user_metadata.full_name) ||
          (typeof sessionUser.user_metadata?.name === "string" &&
            sessionUser.user_metadata.name) ||
          sessionUser.email?.split("@")[0] ||
          "Pengguna";
        cacheDisplayName(name);
        setUser({ id: sessionUser.id, name, email: sessionUser.email, guest: false });
      } else {
        setUser(getGuestUser());
      }
      setLoading(false);
    };

    void supabase.auth
      .getSession()
      .then(({ data }) => apply(data.session?.user ?? null));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) =>
      apply(session?.user ?? null),
    );

    return () => {
      alive = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  const signOut = useCallback(async () => {
    if (isSupabaseConfigured) {
      await createBrowserSupabase()?.auth.signOut();
    }
    signOutGuest();
    setUser(null);
    router.push("/login");
  }, [router]);

  return { user, loading, signOut };
}
