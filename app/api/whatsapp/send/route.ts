import { createClient } from "@/lib/supabase/server";
import {
  buildBeschikbaarheidCheck,
  buildPlaatsingsBevestiging,
  sendWhatsApp,
} from "@/lib/whatsapp";
import { NextResponse } from "next/server";
import { z } from "zod";

const plaatsingSchema = z.object({
  kandidaatNaam: z.string(),
  functie: z.string(),
  bedrijfNaam: z.string(),
  adres: z.string(),
  startdatum: z.string(),
  tijd: z.string(),
  contactpersoon: z.string(),
  contactTelefoon: z.string(),
  meeNemen: z.string().optional(),
});

const schema = z
  .object({
    kandidaatId: z.string().uuid(),
    message: z.string().min(1).max(4000).optional(),
    type: z
      .enum(["custom", "plaatsing_bevestiging", "beschikbaarheid"])
      .optional(),
    plaatsing: plaatsingSchema.optional(),
  })
  .superRefine((data, ctx) => {
    const t = data.type ?? "custom";
    if (t === "plaatsing_bevestiging") {
      if (!data.plaatsing) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "plaatsing verplicht bij type plaatsing_bevestiging",
        });
      }
    } else if (t === "beschikbaarheid") {
      /* bericht wordt gegenereerd */
    } else if (!data.message?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "message verplicht bij type custom",
      });
    }
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

  const { data: kandidaat } = await supabase
    .from("kandidaten")
    .select("*")
    .eq("id", parsed.data.kandidaatId)
    .eq("bureau_id", profile.bureau_id)
    .single();

  if (!kandidaat) {
    return NextResponse.json({ error: "Kandidaat niet gevonden" }, { status: 404 });
  }

  const msgType = parsed.data.type ?? "custom";
  let text: string;
  if (msgType === "plaatsing_bevestiging" && parsed.data.plaatsing) {
    text = buildPlaatsingsBevestiging({
      ...parsed.data.plaatsing,
      kandidaatNaam: parsed.data.plaatsing.kandidaatNaam || kandidaat.naam,
    });
  } else if (msgType === "beschikbaarheid") {
    text = buildBeschikbaarheidCheck(kandidaat.naam);
  } else {
    text = parsed.data.message ?? "";
  }

  try {
    await sendWhatsApp({
      to: kandidaat.telefoon,
      message: text,
      bureauId: profile.bureau_id,
      kandidaatId: kandidaat.id,
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Verzenden mislukt";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
