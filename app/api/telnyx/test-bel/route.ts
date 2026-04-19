import { createClient } from "@/lib/supabase/server";
import { startOutboundCall } from "@/lib/telnyx";
import { NextResponse } from "next/server";

/**
 * Testbel naar het telefoonnummer van het bureau (of eerste kandidaat als fallback).
 * Werkt met TELNYX_MOCK zonder echte API.
 */
export async function POST() {
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

  const { data: bureau } = await supabase
    .from("bureaus")
    .select("*")
    .eq("id", profile.bureau_id)
    .single();

  if (!bureau) {
    return NextResponse.json({ error: "Bureau niet gevonden" }, { status: 404 });
  }

  const { data: kandidaat } = await supabase
    .from("kandidaten")
    .select("*")
    .eq("bureau_id", profile.bureau_id)
    .limit(1)
    .maybeSingle();

  if (!kandidaat) {
    return NextResponse.json(
      { error: "Voeg minstens één kandidaat toe voor een testbel-context" },
      { status: 400 },
    );
  }

  const naar = bureau.telefoon?.trim() || kandidaat.telefoon;

  try {
    const { callId } = await startOutboundCall(
      {
        kandidaatId: kandidaat.id,
        telefoon: kandidaat.telefoon,
        campagneId: kandidaat.id,
        bureauNaam: bureau.naam,
        functie: "Testgesprek",
        screeningVragen: ["Kunt u bevestigen dat u deze test hoort?"],
        salaris: { min: 0, max: 0 },
        beschikbaarheid: "onbekend",
        eisen: "—",
      },
      { naarTelefoon: naar },
    );

    await supabase.from("gesprekken").insert({
      campagne_id: null,
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
