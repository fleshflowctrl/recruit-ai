import { createClient } from "@/lib/supabase/server";
import { startOutboundCall } from "@/lib/telnyx";
import { NextResponse } from "next/server";
import { z } from "zod";

const schema = z.object({
  kandidaatId: z.string().uuid(),
  campagneId: z.string().uuid().optional().nullable(),
});

export async function POST(request: Request) {
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

  const parsed = schema.safeParse(json);
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

  const { data: kandidaat } = await supabase
    .from("kandidaten")
    .select("*")
    .eq("id", parsed.data.kandidaatId)
    .eq("bureau_id", profile.bureau_id)
    .single();

  if (!kandidaat) {
    return NextResponse.json({ error: "Kandidaat niet gevonden" }, { status: 404 });
  }

  const { data: bureau } = await supabase
    .from("bureaus")
    .select("*")
    .eq("id", profile.bureau_id)
    .single();

  if (!bureau) {
    return NextResponse.json({ error: "Bureau niet gevonden" }, { status: 404 });
  }

  let vacature: Record<string, unknown> | null = null;
  let screeningVragen: string[] = [];
  let campagneId = parsed.data.campagneId ?? "";

  if (parsed.data.campagneId) {
    const { data: campagne } = await supabase
      .from("campagnes")
      .select("*")
      .eq("id", parsed.data.campagneId)
      .eq("bureau_id", profile.bureau_id)
      .single();
    if (campagne) {
      screeningVragen = Array.isArray(campagne.screening_vragen)
        ? (campagne.screening_vragen as string[])
        : [];
      if (campagne.vacature_id) {
        const v = await supabase
          .from("vacatures")
          .select("*")
          .eq("id", campagne.vacature_id)
          .single();
        vacature = v.data;
      }
    }
  }

  try {
    const { callId } = await startOutboundCall({
      kandidaatId: kandidaat.id,
      telefoon: kandidaat.telefoon,
      campagneId: campagneId || kandidaat.id,
      bureauNaam: bureau.naam,
      functie: String(vacature?.titel ?? "Algemeen gesprek"),
      screeningVragen:
        screeningVragen.length > 0
          ? screeningVragen
          : ["Kunt u kort uw ervaring beschrijven?"],
      salaris: {
        min: Number(vacature?.salaris_min ?? kandidaat.salariswens_min ?? 0),
        max: Number(vacature?.salaris_max ?? kandidaat.salariswens_max ?? 0),
      },
      beschikbaarheid: kandidaat.beschikbaar_per
        ? String(kandidaat.beschikbaar_per)
        : "onbekend",
      eisen: Array.isArray(vacature?.eisen)
        ? (vacature.eisen as string[]).join(", ")
        : "—",
    });

    await supabase.from("gesprekken").insert({
      campagne_id: parsed.data.campagneId ?? null,
      kandidaat_id: kandidaat.id,
      bureau_id: profile.bureau_id,
      telnyx_call_id: callId,
      status: "bezig",
    });

    return NextResponse.json({ ok: true, callId });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Onbekende fout";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
