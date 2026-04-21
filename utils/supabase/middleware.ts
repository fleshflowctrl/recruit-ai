import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";
import { getSupabasePublishableKey, getSupabaseUrl } from "./env";

/**
 * Maakt een Supabase-client voor de Edge-middleware en houdt het juiste
 * `NextResponse`-object bij bij cookie-updates (sessie verversen).
 */
export function createMiddlewareSupabase(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(
    getSupabaseUrl(),
    getSupabasePublishableKey(),
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet, cacheHeaders) {
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
          Object.entries(cacheHeaders ?? {}).forEach(([key, value]) =>
            response.headers.set(key, value),
          );
        },
      },
    },
  );

  return { supabase, response };
}
