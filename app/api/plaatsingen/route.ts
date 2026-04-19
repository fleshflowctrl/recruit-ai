import { createClient } from "@/lib/supabase/server";
import { createPlaatsingWithSideEffects } from "@/lib/plaatsingen/service";
import { NextResponse } from "next/server";
import { z } from "zod";

const schema = z.object({
  kandidaatId: z.string().uuid(),
  vacatureId: z.string().uuid(),
  opdrachtgeverId: z.string().uuid(),
  startdatum: z.string().min(1),
  einddatum: z.string().nullable().optional(),
  starttijd: z.string().min(1).default("08:00"),
  adres: z.string().min(1),
  contactpersoon: z.string().min(1),
  contactTelefoon: z.string().min(1),
  meeNemen: z.string().optional(),
  campagneId: z.string().uuid().optional().nullable(),
  uurtarief_kandidaat: z.number().nullable().optional(),
  uurtarief_opdrachtgever: z.number().nullable().optional(),
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
  if (!profile?.bureau_id) {
    return NextResponse.json({ error: "Geen profiel" }, { status: 403 });
  }

  const bureauId = profile.bureau_id;
  const p = parsed.data;

  const { data: kandidaat } = await supabase
    .from("kandidaten")
    .select("id, naam, bureau_id")
    .eq("id", p.kandidaatId)
    .single();
  if (!kandidaat || kandidaat.bureau_id !== bureauId) {
    return NextResponse.json({ error: "Kandidaat niet gevonden" }, { status: 404 });
  }

  const { data: vacature } = await supabase
    .from("vacatures")
    .select("id, titel, bureau_id, opdrachtgever_id")
    .eq("id", p.vacatureId)
    .single();
  if (!vacature || vacature.bureau_id !== bureauId) {
    return NextResponse.json({ error: "Vacature niet gevonden" }, { status: 404 });
  }

  const { data: og } = await supabase
    .from("opdrachtgevers")
    .select("id, naam, bureau_id")
    .eq("id", p.opdrachtgeverId)
    .single();
  if (!og || og.bureau_id !== bureauId) {
    return NextResponse.json({ error: "Opdrachtgever niet gevonden" }, { status: 404 });
  }

  if (vacature.opdrachtgever_id !== og.id) {
    return NextResponse.json(
      { error: "Vacature hoort niet bij deze opdrachtgever" },
      { status: 400 },
    );
  }

  try {
    const { plaatsing } = await createPlaatsingWithSideEffects(
      supabase,
      {
        bureauId,
        kandidaatId: p.kandidaatId,
        vacatureId: p.vacatureId,
        opdrachtgeverId: p.opdrachtgeverId,
        startdatum: p.startdatum,
        einddatum: p.einddatum ?? null,
        starttijd: p.starttijd,
        adres: p.adres,
        contactpersoon: p.contactpersoon,
        contactTelefoon: p.contactTelefoon,
        meeNemen: p.meeNemen ?? null,
        campagneId: p.campagneId ?? null,
        kandidaatNaam: kandidaat.naam,
        functieTitel: vacature.titel,
        bedrijfNaam: og.naam,
        uurtarief_kandidaat: p.uurtarief_kandidaat ?? null,
        uurtarief_opdrachtgever: p.uurtarief_opdrachtgever ?? null,
      },
      {
        updateCampagneKandidaat: Boolean(p.campagneId),
        campagneId: p.campagneId ?? null,
      },
    );
    return NextResponse.json({ ok: true, plaatsing });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Plaatsing opslaan mislukt";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
