import { createClient } from "@/lib/supabase/server";
import { buildPlaatsingsBevestiging, sendWhatsApp } from "@/lib/whatsapp";
import { inngest } from "@/inngest/client";
import { NextResponse } from "next/server";
import { z } from "zod";
import { format } from "date-fns";
import { nl } from "date-fns/locale";

const schema = z.object({
  gesprekId: z.string().uuid(),
  campagneId: z.string().uuid(),
});

function reminderDayBeforeAt17(startdatum: string | null): string | null {
  if (!startdatum) return null;
  const [y, m, d] = startdatum.split("-").map(Number);
  if (!y || !m || !d) return null;
  const start = new Date(y, m - 1, d);
  const reminder = new Date(start);
  reminder.setDate(reminder.getDate() - 1);
  reminder.setHours(17, 0, 0, 0);
  return reminder.toISOString();
}

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

  const startLabel = format(new Date(`${startdatum}T12:00:00`), "d MMMM yyyy", {
    locale: nl,
  });

  const { data: plaatsing, error: pErr } = await supabase
    .from("plaatsingen")
    .insert({
      bureau_id: bureauId,
      vacature_id: vacature.id,
      kandidaat_id: kandidaat.id,
      opdrachtgever_id: opdrachtgever.id,
      startdatum,
      einddatum: vacature.einddatum,
      status: "bevestigd",
    })
    .select("id")
    .single();

  if (pErr || !plaatsing) {
    return NextResponse.json(
      { error: pErr?.message ?? "Plaatsing opslaan mislukt" },
      { status: 500 },
    );
  }

  await supabase
    .from("kandidaten")
    .update({ status: "geplaatst" })
    .eq("id", kandidaat.id);

  await supabase
    .from("campagne_kandidaten")
    .update({ status: "geschikt" })
    .eq("campagne_id", parsed.data.campagneId)
    .eq("kandidaat_id", kandidaat.id);

  const msg = buildPlaatsingsBevestiging({
    kandidaatNaam: kandidaat.naam,
    functie: vacature.titel,
    bedrijfNaam: opdrachtgever.naam,
    adres: opdrachtgever.adres ?? vacature.locatie ?? "—",
    startdatum: startLabel,
    tijd: "08:00",
    contactpersoon: opdrachtgever.contactpersoon ?? "—",
    contactTelefoon: opdrachtgever.telefoon ?? "—",
  });

  try {
    await sendWhatsApp({
      to: kandidaat.telefoon,
      message: msg,
      bureauId,
      kandidaatId: kandidaat.id,
    });
  } catch (e) {
    console.error(e);
    /* plaatsing blijft staan; WhatsApp kan later opnieuw */
  }

  const reminderAt = reminderDayBeforeAt17(startdatum);

  await inngest.send({
    name: "plaatsing/created",
    data: {
      plaatsingId: plaatsing.id,
      bureauId,
      kandidaatId: kandidaat.id,
      startdatum,
      reminderAt,
      bedrijfNaam: opdrachtgever.naam,
      tijd: "08:00",
    },
  });

  return NextResponse.json({ ok: true, plaatsingId: plaatsing.id });
}
