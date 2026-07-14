import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Middleware (W-FR-1.1) — proteksi rute auth end-to-end.
 *
 * Bila Supabase terkonfigurasi:
 *   - /canvas/* & /dashboard memerlukan sesi valid.
 *   - Refresh session lewat cookie setiap kali.
 *   - Tanpa sesi → redirect ke /login.
 *
 * Bila Supabase tidak terkonfigurasi (mode tamu):
 *   - Semua rute diizinkan — aplikasi berjalan penuh tanpa auth.
 */

const isSupabaseConfigured = Boolean(
  process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
);

const protectedPrefixes = ["/canvas/", "/dashboard"];

function isProtected(pathname: string): boolean {
  return protectedPrefixes.some((p) => pathname === p.slice(0, -1) || pathname.startsWith(p));
}

export async function middleware(request: NextRequest) {
  if (!isSupabaseConfigured || !isProtected(request.nextUrl.pathname)) {
    return NextResponse.next();
  }

  let response = NextResponse.next({ request: { headers: request.headers } });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (
          cookiesToSet: { name: string; value: string; options: CookieOptions }[],
        ) => {
          for (const { name, value, options } of cookiesToSet) {
            request.cookies.set({ name, value, ...options });
            response = NextResponse.next({ request: { headers: request.headers } });
            response.cookies.set({ name, value, ...options });
          }
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    loginUrl.searchParams.set("redirectedFrom", request.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  return response;
}

export const config = {
  matcher: ["/canvas/:path*", "/dashboard/:path*"],
};
