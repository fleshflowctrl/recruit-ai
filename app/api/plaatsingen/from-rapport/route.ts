import { createClient } from "@/lib/supabase/server";
import { createPlaatsingWithSideEffects } from "@/lib/plaatsingen/service";
import { NextResponse } from "next/server";
import { z } from "zod";
import { format } from "date-fns";

const schema = z.object({
  gesprekId: z.string().uuid(),
  campagneId: z.string().uuid(),
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

  const bureauId = profile.bureau_id;

  const { data: gesprek } = await supabase
    .from("gesprekken")
    .select("*")
    .eq("id", parsed.data.gesprekId)
    .eq("bureau_id", bureauId)
    .single();

  if (!gesprek?.kandidaat_id) {
    return NextResponse.json({ error: "Gesprek niet gevonden" }, { status: 404 });
  }

  const { data: campagne } = await supabase
    .from("campagnes")
    .select("id, vacature_id")
    .eq("id", parsed.data.campagneId)
    .eq("bureau_id", bureauId)
    .single();

  if (!campagne?.vacature_id) {
    return NextResponse.json(
      { error: "Campagne heeft geen vacature gekoppeld" },
      { status: 400 },
    );
  }

  const { data: vacature } = await supabase
    .from("vacatures")
    .select("*")
    .eq("id", campagne.vacature_id)
    .eq("bureau_id", bureauId)
    .single();

  if (!vacature?.opdrachtgever_id) {
    return NextResponse.json(
      { error: "Vacature heeft geen opdrachtgever" },
      { status: 400 },
    );
  }

  const { data: opdrachtgever } = await supabase
    .from("opdrachtgevers")
    .select("*")
    .eq("id", vacature.opdrachtgever_id)
    .eq("bureau_id", bureauId)
    .single();

  if (!opdrachtgever) {
    return NextResponse.json(
      { error: "Opdrachtgever niet gevonden" },
      { status: 400 },
    );
  }

  const { data: kandidaat } = await supabase
    .from("kandidaten")
    .select("*")
    .eq("id", gesprek.kandidaat_id)
    .eq("bureau_id", bureauId)
    .single();

  if (!kandidaat) {
    return NextResponse.json({ error: "Kandidaat niet gevonden" }, { status: 404 });
  }

  const startdatum =
    vacature.startdatum ??
    format(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), "yyyy-MM-dd");

  try {
    const { plaatsing } = await createPlaatsingWithSideEffects(
      supabase,
      {
        bureauId,
        kandidaatId: kandidaat.id,
        vacatureId: vacature.id,
        opdrachtgeverId: opdrachtgever.id,
        startdatum,
        einddatum: vacature.einddatum,
        starttijd: "08:00",
        adres: opdrachtgever.adres ?? vacature.locatie ?? "—",
        contactpersoon: opdrachtgever.contactpersoon ?? "—",
        contactTelefoon: opdrachtgever.telefoon ?? "—",
        kandidaatNaam: kandidaat.naam,
        functieTitel: vacature.titel,
        bedrijfNaam: opdrachtgever.naam,
      },
      {
        updateCampagneKandidaat: true,
        campagneId: parsed.data.campagneId,
      },
    );

    const id = plaatsing.id as string;
    return NextResponse.json({ ok: true, plaatsingId: id });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Plaatsing opslaan mislukt";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
