import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { analyseGesprek } from "@/lib/claude";
import { sendGesprekRapportEmail } from "@/lib/email";

export const runtime = "nodejs";

function extractPayload(body: Record<string, unknown>) {
  const data = (body.data ?? body) as Record<string, unknown>;
  const payload = (data.payload ?? data) as Record<string, unknown>;
  const eventType = String(
    data.event_type ?? body.event_type ?? payload.event_type ?? "unknown",
  );
  const callId = String(
    payload.call_control_id ?? payload.id ?? data.call_control_id ?? "",
  );
  const transcript = String(
    payload.transcript ?? payload.text ?? data.transcript ?? "",
  );
  const recordingUrl = payload.recording_urls
    ? String((payload.recording_urls as string[])[0])
    : payload.recording_url
      ? String(payload.recording_url)
      : null;

  let meta: { kandidaat_id?: string; campagne_id?: string } = {};
  const clientState = payload.client_state as string | undefined;
  if (clientState) {
    try {
      meta = JSON.parse(Buffer.from(clientState, "base64").toString("utf8"));
    } catch {
      /* ignore */
    }
  }
  const metadata = (payload.metadata ?? data.metadata) as Record<
    string,
    string
  > | null;
  if (metadata?.kandidaat_id) meta.kandidaat_id = metadata.kandidaat_id;
  if (metadata?.campagne_id) meta.campagne_id = metadata.campagne_id;

  return { eventType, callId, transcript, recordingUrl, meta };
}

export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const { eventType, callId, transcript, recordingUrl, meta } =
    extractPayload(body);
  const admin = createAdminClient();

  if (!callId) {
    return NextResponse.json({ ok: true });
  }

  if (eventType.includes("initiated") || eventType === "call.initiated") {
    await admin
      .from("gesprekken")
      .update({ status: "bezig" })
      .eq("telnyx_call_id", callId);
  }

  if (eventType.includes("answered")) {
    await admin
      .from("gesprekken")
      .update({ status: "bezig" })
      .eq("telnyx_call_id", callId);
  }

  if (recordingUrl && !eventType.includes("hangup")) {
    await admin
      .from("gesprekken")
      .update({ opname_url: recordingUrl })
      .eq("telnyx_call_id", callId);
  }

  const isHangup =
    eventType.includes("hangup") ||
    eventType === "call.hangup" ||
    eventType.includes("call_ai");

  if (isHangup && transcript.length > 20) {
    const { data: gesprek } = await admin
      .from("gesprekken")
      .select("*")
      .eq("telnyx_call_id", callId)
      .maybeSingle();

    if (!gesprek?.campagne_id || !gesprek.kandidaat_id) {
      return NextResponse.json({ ok: true });
    }

    const { data: campagne } = await admin
      .from("campagnes")
      .select("*")
      .eq("id", gesprek.campagne_id)
      .single();

    const { data: kandidaat } = await admin
      .from("kandidaten")
      .select("*")
      .eq("id", gesprek.kandidaat_id)
      .single();

    let vacature: Record<string, unknown> | null = null;
    if (campagne?.vacature_id) {
      const v = await admin
        .from("vacatures")
        .select("*")
        .eq("id", campagne.vacature_id)
        .single();
      vacature = v.data;
    }

    const screeningVragen = Array.isArray(campagne?.screening_vragen)
      ? (campagne.screening_vragen as string[])
      : [];

    const analyse = await analyseGesprek(transcript, {
      functie: String(vacature?.titel ?? "Functie"),
      eisen: Array.isArray(vacature?.eisen)
        ? (vacature.eisen as string[]).join(", ")
        : "—",
      salaris: {
        min: Number(vacature?.salaris_min ?? 2500),
        max: Number(vacature?.salaris_max ?? 3500),
      },
      beschikbaarheid: "onbekend",
      screeningVragen,
    });

    await admin
      .from("gesprekken")
      .update({
        status: "voltooid",
        transcript,
        opname_url: recordingUrl,
        score: analyse.score,
        aanbeveling: analyse.aanbeveling,
        samenvatting: analyse.samenvatting,
        antwoorden: analyse.antwoorden,
        positieve_punten: analyse.positieve_punten,
        negatieve_punten: analyse.negatieve_punten,
      })
      .eq("telnyx_call_id", callId);

    const ckStatus =
      analyse.aanbeveling === "GESCHIKT"
        ? "geschikt"
        : analyse.aanbeveling === "TWIJFEL"
          ? "twijfel"
          : "niet_geschikt";

    const kid = String(kandidaat?.id ?? meta.kandidaat_id ?? "");
    const cid = String(campagne?.id ?? meta.campagne_id ?? gesprek.campagne_id);
    if (kid && cid) {
      await admin
        .from("campagne_kandidaten")
        .update({ status: ckStatus })
        .eq("campagne_id", cid)
        .eq("kandidaat_id", kid);
    }

    const { data: campagneRow } = await admin
      .from("campagnes")
      .select("*")
      .eq("id", cid)
      .single();
    if (campagneRow) {
      await admin
        .from("campagnes")
        .update({
          gebeld: (campagneRow.gebeld ?? 0) + 1,
          geschikt:
            ckStatus === "geschikt"
              ? (campagneRow.geschikt ?? 0) + 1
              : campagneRow.geschikt,
          twijfel:
            ckStatus === "twijfel"
              ? (campagneRow.twijfel ?? 0) + 1
              : campagneRow.twijfel,
          niet_geschikt:
            ckStatus === "niet_geschikt"
              ? (campagneRow.niet_geschikt ?? 0) + 1
              : campagneRow.niet_geschikt,
        })
        .eq("id", cid);
    }

    const { data: bureau } = await admin
      .from("bureaus")
      .select("*")
      .eq("id", gesprek.bureau_id)
      .single();
    if (bureau) {
      await admin
        .from("bureaus")
        .update({
          credits_resterend: Math.max(0, (bureau.credits_resterend ?? 0) - 1),
        })
        .eq("id", bureau.id);
    }

    if (campagne?.rapport_email) {
      await sendGesprekRapportEmail({
        to: String(campagne.rapport_email),
        kandidaatNaam: String(kandidaat?.naam ?? ""),
        functie: String(vacature?.titel ?? ""),
        analyse,
        rapportUrl: `${process.env.NEXT_PUBLIC_APP_URL}/campagnes/${cid}`,
      });
    }
  }

  return NextResponse.json({ ok: true });
}
