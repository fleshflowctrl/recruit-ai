import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { z } from "zod";

const patchSchema = z.object({
  status: z.enum(["niet_geschikt", "geschikt", "twijfel", "wacht"]),
});

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Niet geautoriseerd" }, { status: 401 });
  }

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: "Ongeldige JSON" }, { status: 400 });
  }

  const parsed = patchSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("bureau_id")
    .eq("id", user.id)
    .single();
  if (!profile) {
    return NextResponse.json({ error: "Geen profiel" }, { status: 403 });
  }

  const { data: ck } = await supabase
    .from("campagne_kandidaten")
    .select("id, campagne_id")
    .eq("id", id)
    .maybeSingle();

  if (!ck) {
    return NextResponse.json({ error: "Niet gevonden" }, { status: 404 });
  }

  const { data: campagne } = await supabase
    .from("campagnes")
    .select("bureau_id")
    .eq("id", ck.campagne_id)
    .single();

  if (!campagne || campagne.bureau_id !== profile.bureau_id) {
    return NextResponse.json({ error: "Niet gevonden" }, { status: 404 });
  }

  const { error } = await supabase
    .from("campagne_kandidaten")
    .update({ status: parsed.data.status })
    .eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
