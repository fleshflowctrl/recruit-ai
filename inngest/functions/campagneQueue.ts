import { inngest } from "@/inngest/client";
import { createAdminClient } from "@/lib/supabase/admin";
import { startOutboundCall } from "@/lib/telnyx";
import { analyseGesprek } from "@/lib/claude";
import { sendGesprekRapportEmail } from "@/lib/email";

const GAP_SECONDS = 30;
const MAX_PARALLEL = 3;

async function bumpCampagneCounters(
  admin: ReturnType<typeof createAdminClient>,
  campagneId: string,
  field: "gebeld" | "geschikt" | "twijfel" | "niet_geschikt" | "geen_gehoor",
) {
  const { data: cur } = await admin
    .from("campagnes")
    .select(field)
    .eq("id", campagneId)
    .single();
  const row = cur as Record<string, number | undefined> | null;
  const n = typeof row?.[field] === "number" ? row[field]! : 0;
  await admin
    .from("campagnes")
    .update({ [field]: n + 1 })
    .eq("id", campagneId);
}

export const campagneStart = inngest.createFunction(
  {
    id: "campagne-start",
    name: "Campagne wachtrij",
    concurrency: { limit: 1, key: "event.data.campagneId" },
    triggers: [{ event: "campagne/start" }],
  },
  async ({ event, step }) => {
    const { campagneId, bureauId } = event.data as {
      campagneId: string;
      bureauId: string;
    };
    const admin = createAdminClient();

    const { data: campagne, error: cErr } = await admin
      .from("campagnes")
      .select("*")
      .eq("id", campagneId)
      .single();
    if (cErr || !campagne) throw new Error("Campagne niet gevonden");

    if (campagne.status === "gepauzeerd" || campagne.status === "gestopt") {
      return { ok: false, reason: "gestopt" };
    }

    let vacature: Record<string, unknown> | null = null;
    if (campagne.vacature_id) {
      const { data: v } = await admin
        .from("vacatures")
        .select("*")
        .eq("id", campagne.vacature_id)
        .single();
      vacature = v;
    }

    const { data: rows, error: ckErr } = await admin
      .from("campagne_kandidaten")
      .select("*, kandidaten(*)")
      .eq("campagne_id", campagneId)
      .in("status", ["wacht", "geen_gehoor"]);
    if (ckErr) throw ckErr;

    const now = new Date();
    const pending = (rows ?? []).filter((r) => {
      if (r.status === "geen_gehoor" && r.volgende_bel_poging) {
        return new Date(r.volgende_bel_poging as string) <= now;
      }
      return r.status === "wacht";
    });

    const { data: bureau } = await admin
      .from("bureaus")
      .select("*")
      .eq("id", bureauId)
      .single();
    if (!bureau) throw new Error("Bureau niet gevonden");

    const screeningVragen = Array.isArray(campagne.screening_vragen)
      ? (campagne.screening_vragen as string[])
      : [];

    let parallel = 0;
    for (const ck of pending) {
      const stop = await step.run(`check-pause-${ck.id}`, async () => {
        const { data: fresh } = await admin
          .from("campagnes")
          .select("status")
          .eq("id", campagneId)
          .single();
        return fresh?.status === "gepauzeerd" || fresh?.status === "gestopt";
      });
      if (stop) break;

      if (parallel >= MAX_PARALLEL) {
        await step.sleep("gap", `${GAP_SECONDS}s`);
        parallel = 0;
      }
      parallel += 1;

      await step.run(`dial-${ck.id}`, async () => {
        const k = ck.kandidaten as Record<string, unknown> | null;
        if (!k?.id || !k.telefoon) return;

        await admin
          .from("campagne_kandidaten")
          .update({ status: "bezig" })
          .eq("id", ck.id);

        const { callId } = await startOutboundCall({
          kandidaatId: String(k.id),
          telefoon: String(k.telefoon),
          campagneId,
          bureauNaam: bureau.naam,
          functie: String(vacature?.titel ?? "Vacature"),
          screeningVragen,
          salaris: {
            min: Number(vacature?.salaris_min ?? 0),
            max: Number(vacature?.salaris_max ?? 0),
          },
          beschikbaarheid: k.beschikbaar_per
            ? String(k.beschikbaar_per)
            : "onbekend",
          eisen: Array.isArray(vacature?.eisen)
            ? (vacature?.eisen as string[]).join(", ")
            : "—",
        });

        await admin.from("gesprekken").insert({
          campagne_id: campagneId,
          kandidaat_id: String(k.id),
          bureau_id: bureauId,
          telnyx_call_id: callId,
          status: "bezig",
          bel_poging: (ck.bel_pogingen as number) + 1,
        });

        if (process.env.TELNYX_MOCK === "true") {
          const transcript =
            "[AI]: Goedemiddag.\n[Kandidaat]: Hallo, ik ben beschikbaar volgende week.";
          const analyse = await analyseGesprek(transcript, {
            functie: String(vacature?.titel ?? "Functie"),
            eisen: Array.isArray(vacature?.eisen)
              ? (vacature?.eisen as string[]).join(", ")
              : "—",
            salaris: {
              min: Number(vacature?.salaris_min ?? 2500),
              max: Number(vacature?.salaris_max ?? 3500),
            },
            beschikbaarheid: "per direct",
            screeningVragen,
          });

          await admin
            .from("gesprekken")
            .update({
              status: "voltooid",
              duur_seconden: 120,
              transcript,
              score: analyse.score,
              aanbeveling: analyse.aanbeveling,
              samenvatting: analyse.samenvatting,
              antwoorden: analyse.antwoorden,
              positieve_punten: analyse.positieve_punten,
              negatieve_punten: analyse.negatieve_punten,
            })
            .eq("telnyx_call_id", callId);

          const aanbeveling = analyse.aanbeveling;
          const ckStatus =
            aanbeveling === "GESCHIKT"
              ? "geschikt"
              : aanbeveling === "TWIJFEL"
                ? "twijfel"
                : "niet_geschikt";

          await admin
            .from("campagne_kandidaten")
            .update({
              status: ckStatus,
              bel_pogingen: (ck.bel_pogingen as number) + 1,
            })
            .eq("id", ck.id);

          await bumpCampagneCounters(admin, campagneId, "gebeld");
          if (ckStatus === "geschikt") await bumpCampagneCounters(admin, campagneId, "geschikt");
          if (ckStatus === "twijfel") await bumpCampagneCounters(admin, campagneId, "twijfel");
          if (ckStatus === "niet_geschikt")
            await bumpCampagneCounters(admin, campagneId, "niet_geschikt");

          await admin
            .from("bureaus")
            .update({
              credits_resterend: Math.max(0, (bureau.credits_resterend ?? 0) - 1),
            })
            .eq("id", bureauId);

          if (campagne.rapport_email) {
            await sendGesprekRapportEmail({
              to: String(campagne.rapport_email),
              kandidaatNaam: String(k.naam),
              functie: String(vacature?.titel ?? ""),
              analyse,
              rapportUrl: `${process.env.NEXT_PUBLIC_APP_URL}/campagnes/${campagneId}`,
            });
          }
        }
      });
    }

    return { ok: true, processed: pending.length };
  },
);

