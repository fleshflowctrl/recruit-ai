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

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (WEBHOOK_PREFIXES.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  const { supabase, response } = createMiddlewareSupabase(request);
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (pathname === "/account-setup" || pathname.startsWith("/account-setup/")) {
    if (!user) {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      return NextResponse.redirect(url);
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
      return NextResponse.redirect(url);
    }
    return response;
  }

  if (!user) {
    if (pathname.startsWith("/api")) {
      return NextResponse.json(
        { error: "Niet geautoriseerd" },
        { status: 401 },
      );
    }
    if (pathname === "/") {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      return NextResponse.redirect(url);
    }
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("redirect", pathname);
    return NextResponse.redirect(url);
  }

  if (pathname === "/") {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
