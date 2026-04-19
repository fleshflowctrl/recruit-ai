import { cookies } from "next/headers";
import { createClient as createServerClient } from "@/utils/supabase/server";

/** Server-side Supabase-client (RLS met gebruikerssessie). */
export async function createClient() {
  const cookieStore = await cookies();
  return createServerClient(cookieStore);
}
