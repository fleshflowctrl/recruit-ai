import { createClient } from "@/lib/supabase/server";
import { analyseGesprek } from "@/lib/claude";
import { NextResponse } from "next/server";
import { z } from "zod";

const schema = z.object({
  transcript: z.string().min(10),
  vacature: z.object({
    functie: z.string(),
    eisen: z.string(),
    salaris: z.object({ min: z.number(), max: z.number() }),
    beschikbaarheid: z.string(),
    screeningVragen: z.array(z.string()),
  }),
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

  try {
    const result = await analyseGesprek(parsed.data.transcript, parsed.data.vacature);
    return NextResponse.json(result);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Analyse mislukt";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
