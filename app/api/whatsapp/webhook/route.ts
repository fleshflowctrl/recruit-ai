import { createAdminClient } from "@/lib/supabase/admin";
import { sendZiekMeldingNaarBureau } from "@/lib/email";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

function normalizePhone(s: string): string {
  return s.replace(/\D/g, "");
}

export async function POST(request: Request) {
  try {
    let body: Record<string, unknown>;
    try {
      body = (await request.json()) as Record<string, unknown>;
    } catch {
      return NextResponse.json({ ok: true });
    }

    const data = (body.data ?? body) as Record<string, unknown>;
    const rawFrom = data.from as Record<string, unknown> | string | undefined;
    const from = String(
      typeof rawFrom === "object" && rawFrom && "phone_number" in rawFrom
        ? rawFrom.phone_number
        : rawFrom ?? "",
    );
    const text = String(data.text ?? data.body ?? "").trim();
    const admin = createAdminClient();

    const norm = normalizePhone(from);
    const { data: kandidaten } = await admin.from("kandidaten").select("*");

    const kandidaat = (kandidaten ?? []).find(
      (k) =>
        normalizePhone(k.telefoon) === norm ||
        k.telefoon === from ||
        k.telefoon.replace(/\s/g, "") === from.replace(/\s/g, ""),
    );

    if (kandidaat && text) {
      await admin.from("berichten").insert({
        bureau_id: kandidaat.bureau_id,
        kandidaat_id: kandidaat.id,
        kanaal: "whatsapp",
        richting: "inbound",
        inhoud: text,
        status: "ontvangen",
        gelezen: false,
      });

      const lower = text.toLowerCase();

      if (lower.includes("ja")) {
        const { data: plaatsing } = await admin
          .from("plaatsingen")
          .select("id")
          .eq("kandidaat_id", kandidaat.id)
          .eq("bureau_id", kandidaat.bureau_id)
          .eq("status", "bevestigd")
          .order("aangemaakt_op", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (plaatsing) {
          await admin
            .from("plaatsingen")
            .update({ status: "bevestigd_door_kandidaat" })
            .eq("id", plaatsing.id);
        }
      } else if (lower.includes("nee")) {
        await admin
          .from("kandidaten")
          .update({ status: "niet_beschikbaar" })
          .eq("id", kandidaat.id);
      }

      if (lower.includes("ziek")) {
        const { data: bureau } = await admin
          .from("bureaus")
          .select("email, naam")
          .eq("id", kandidaat.bureau_id)
          .single();
        if (bureau?.email) {
          try {
            await sendZiekMeldingNaarBureau({
              bureauEmail: bureau.email,
              kandidaatNaam: kandidaat.naam,
              bericht: text,
            });
          } catch (e) {
            console.error("sendZiekMeldingNaarBureau", e);
          }
        }
      }
    }
  } catch (e) {
    console.error("whatsapp webhook", e);
  }

  return NextResponse.json({ ok: true });
}
