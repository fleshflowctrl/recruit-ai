import type { User } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";
import { createMiddlewareSupabase } from "@/utils/supabase/middleware";

/** Geen auth-cookies nodig (externe webhooks). */
const WEBHOOK_PREFIXES = [
  "/api/telnyx",
  "/api/whatsapp/webhook",
  "/api/stripe/webhook",
  "/api/inngest",
  "/api/cron",
];

type AuthMiddlewareResult = ReturnType<typeof createMiddlewareSupabase>;

/** Zet sessie-cookies en no-cache headers van de Supabase-middleware-response op `dest` (redirect/json). */
function withRefreshedSession(
  authResponse: NextResponse,
  dest: NextResponse,
): NextResponse {
  authResponse.cookies.getAll().forEach((cookie) => {
    dest.cookies.set(cookie);
  });
  for (const name of ["cache-control", "expires", "pragma"] as const) {
    const v = authResponse.headers.get(name);
    if (v) dest.headers.set(name, v);
  }
  return dest;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (WEBHOOK_PREFIXES.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  let ctx: AuthMiddlewareResult;
  try {
    ctx = createMiddlewareSupabase(request);
  } catch {
    if (pathname.startsWith("/api")) {
      return NextResponse.json(
        { error: "Serverconfiguratie ontbreekt (Supabase)." },
        { status: 503 },
      );
    }
    // Voorkom redirect-loop richting /login en laat de auth-flow door.
    if (
      pathname === "/login" ||
      pathname.startsWith("/login/") ||
      pathname.startsWith("/auth")
    ) {
      return NextResponse.next();
    }
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.search = "";
    return NextResponse.redirect(url);
  }

  const { supabase, response } = ctx;

  let user: User | null = null;
  try {
    const { data, error } = await supabase.auth.getUser();
    user = !error && data.user ? data.user : null;
  } catch {
    user = null;
  }

  if (pathname === "/account-setup" || pathname.startsWith("/account-setup/")) {
    if (!user) {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      return withRefreshedSession(response, NextResponse.redirect(url));
    }
    return response;
  }

  if (pathname.startsWith("/auth")) {
    return response;
  }

  if (pathname === "/login" || pathname.startsWith("/login/")) {
    if (user) {
      const url = request.nextUrl.clone();
      url.pathname = "/dashboard";
      return withRefreshedSession(response, NextResponse.redirect(url));
    }
    return response;
  }

  if (!user) {
    if (pathname.startsWith("/api")) {
      return withRefreshedSession(
        response,
        NextResponse.json({ error: "Niet geautoriseerd" }, { status: 401 }),
      );
    }
    if (pathname === "/") {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      return withRefreshedSession(response, NextResponse.redirect(url));
    }
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("redirect", pathname);
    return withRefreshedSession(response, NextResponse.redirect(url));
  }

  if (pathname === "/") {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return withRefreshedSession(response, NextResponse.redirect(url));
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
