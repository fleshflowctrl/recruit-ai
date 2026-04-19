import { createClient } from "@/lib/supabase/server";
import { sendWhatsAppMessage } from "@/lib/whatsapp";
import { NextResponse } from "next/server";
import { z } from "zod";

const schema = z.object({
  kandidaatId: z.string().uuid(),
  bericht: z.string().min(1).max(4000),
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

  const { data: bureau } = await supabase
    .from("bureaus")
    .select("*")
    .eq("id", profile.bureau_id)
    .single();

  const { data: kandidaat } = await supabase
    .from("kandidaten")
    .select("*")
    .eq("id", parsed.data.kandidaatId)
    .eq("bureau_id", profile.bureau_id)
    .single();

  if (!bureau || !kandidaat) {
    return NextResponse.json({ error: "Niet gevonden" }, { status: 404 });
  }

  const from =
    bureau.whatsapp_nummer ??
    process.env.TELNYX_PHONE_NUMBER ??
    "";

  try {
    const { messageId } = await sendWhatsAppMessage({
      from,
      to: kandidaat.telefoon,
      text: parsed.data.bericht,
    });

    await supabase.from("berichten").insert({
      bureau_id: profile.bureau_id,
      kandidaat_id: kandidaat.id,
      kanaal: "whatsapp",
      richting: "outbound",
      inhoud: parsed.data.bericht,
      status: "verzonden",
      telnyx_message_id: messageId,
    });

    return NextResponse.json({ ok: true, messageId });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Verzenden mislukt";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
