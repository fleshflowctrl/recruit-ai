import { createClient } from "@/lib/supabase/server";
import { inngest } from "@/inngest/client";
import { NextResponse } from "next/server";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: campagneId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Niet geautoriseerd" }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("bureau_id")
    .eq("id", user.id)
    .single();
  if (!profile) {
    return NextResponse.json({ error: "Geen profiel" }, { status: 403 });
  }

  const { data: campagne } = await supabase
    .from("campagnes")
    .select("*")
    .eq("id", campagneId)
    .single();
  if (!campagne || campagne.bureau_id !== profile.bureau_id) {
    return NextResponse.json({ error: "Campagne niet gevonden" }, { status: 404 });
  }

  const { data: bureau } = await supabase
    .from("bureaus")
    .select("credits_resterend")
    .eq("id", profile.bureau_id)
    .single();

  if ((bureau?.credits_resterend ?? 0) < (campagne.totaal_kandidaten ?? 0)) {
    return NextResponse.json(
      { error: "Onvoldoende credits voor deze campagne." },
      { status: 400 },
    );
  }

  const { error: updErr } = await supabase
    .from("campagnes")
    .update({ status: "actief" })
    .eq("id", campagneId);

  if (updErr) {
    return NextResponse.json(
      { error: updErr.message ?? "Campagne bijwerken mislukt" },
      { status: 500 },
    );
  }

  const skipInngest =
    process.env.NODE_ENV === "development" &&
    process.env.SKIP_INNGEST_SEND === "true";

  if (!skipInngest) {
    try {
      await inngest.send({
        name: "campagne/start",
        data: { campagneId, bureauId: profile.bureau_id },
      });
    } catch (e) {
      await supabase
        .from("campagnes")
        .update({ status: "concept" })
        .eq("id", campagneId);
      const msg = e instanceof Error ? e.message : "Inngest niet bereikbaar";
      return NextResponse.json(
        {
          error: `Starten mislukt: ${msg}. Start de Inngest dev server (npx inngest-cli@latest dev), zet INNGEST_EVENT_KEY voor productie, of SKIP_INNGEST_SEND=true in .env.local om de wachtrij over te slaan.`,
        },
        { status: 502 },
      );
    }
  }

  return NextResponse.json({ ok: true });
}
