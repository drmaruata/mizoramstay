import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Next.js 16 proxy (formerly middleware).
 *
 * Responsibilities:
 *  - Refresh the Supabase session and keep cookies in sync.
 *  - Enforce route-level access control based on the user's role.
 *
 * IMPORTANT: Do not run any code between `createServerClient` and
 * `supabase.auth.getUser()`. A simple mistake could make it very hard to
 * debug users being randomly logged out.
 */
export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet, headers) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
          Object.entries(headers).forEach(([key, value]) =>
            supabaseResponse.headers.set(key, value),
          );
        },
      },
    },
  );

  // IMPORTANT: DO NOT REMOVE auth.getUser()
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;

  // Fetch the user's role (only when authenticated) to enforce RBAC.
  let role: string | null = null;
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();
    role = profile?.role ?? null;
  }

  const isAuthPage = pathname.startsWith("/login") || pathname.startsWith("/signup");
  const isHostRoute = pathname.startsWith("/host");
  const isAdminRoute = pathname.startsWith("/admin");
  const isAccountRoute = pathname.startsWith("/account");

  // Redirect authenticated users away from auth pages.
  if (user && isAuthPage) {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    return NextResponse.redirect(url);
  }

  // Protect account routes: any authenticated user.
  if (isAccountRoute && !user) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  // Protect host routes: HOST, ADMIN, SUPER_ADMIN.
  if (isHostRoute && (!user || !["HOST", "ADMIN", "SUPER_ADMIN"].includes(role ?? ""))) {
    const url = request.nextUrl.clone();
    url.pathname = user ? "/forbidden" : "/login";
    return NextResponse.redirect(url);
  }

  // Protect admin routes: ADMIN, SUPER_ADMIN.
  if (isAdminRoute && (!user || !["ADMIN", "SUPER_ADMIN"].includes(role ?? ""))) {
    const url = request.nextUrl.clone();
    url.pathname = user ? "/forbidden" : "/login";
    return NextResponse.redirect(url);
  }

  // IMPORTANT: You *must* return the supabaseResponse object as it is.
  return supabaseResponse;
}

export const proxyConfig = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public assets
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
