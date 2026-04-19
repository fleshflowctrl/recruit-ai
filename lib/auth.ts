import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import type { Bureau, Profile } from "@/lib/types";

export type SessionContext = {
  userId: string;
  profile: Profile;
  bureau: Bureau;
};

/**
 * Volledige bureau-sessie. Geen gebruiker → null.
 * Wél ingelogd maar geen profiel/bureau → redirect naar /account-setup (geen stille terugkeer naar login).
 */
export async function getSessionContext(): Promise<SessionContext | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile, error: pErr } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();
  if (pErr || !profile) {
    redirect("/account-setup");
  }

  const { data: bureau, error: bErr } = await supabase
    .from("bureaus")
    .select("*")
    .eq("id", profile.bureau_id)
    .single();
  if (bErr || !bureau) {
    redirect("/account-setup");
  }

  return {
    userId: user.id,
    profile: profile as Profile,
    bureau: bureau as Bureau,
  };
}
