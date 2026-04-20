import { inngest } from "@/inngest/client";
import { createAdminClient } from "@/lib/supabase/admin";
import { buildBeschikbaarheidCheck, sendWhatsApp } from "@/lib/whatsapp";
import { getFlowSettings, matchesDagEnTijd } from "@/lib/automatisering";

const BATCH = 10;

export const beschikbaarheidCheck = inngest.createFunction(
  {
    id: "beschikbaarheid-check",
    name: "Beschikbaarheid check",
    /** Elk uur; per bureau wordt gecontroleerd op ingestelde dag + tijd */
    triggers: [{ cron: "0 * * * *" }],
  },
  async ({ step }) => {
    const now = new Date();
    const bureaus = await step.run("laad-bureaus", async () => {
      const admin = createAdminClient();
      const { data } = await admin.from("bureaus").select("id");
      return data ?? [];
    });

    for (const b of bureaus) {
      const cfg = await getFlowSettings(b.id);
      if (!cfg.hasOptionalEnabled("beschikbaarheid")) continue;
      if (
        !matchesDagEnTijd(
          now,
          cfg.beschikbaarheid.dag,
          cfg.beschikbaarheid.tijdstip,
        )
      ) {
        continue;
      }

      await step.run(`whatsapp-bureau-${b.id}`, async () => {
        const admin = createAdminClient();
        let q = admin
          .from("kandidaten")
          .select("id, naam, telefoon")
          .eq("bureau_id", b.id);
        if (cfg.beschikbaarheid.sturenNaar === "Alleen actieve kandidaten") {
          q = q.eq("status", "actief");
        }
        const { data: kandidaten } = await q;

        const list = kandidaten ?? [];
        for (let i = 0; i < list.length; i += BATCH) {
          const batch = list.slice(i, i + BATCH);
          await Promise.all(
            batch.map(async (k) => {
              const msg = buildBeschikbaarheidCheck(k.naam);
              try {
                await sendWhatsApp({
                  to: k.telefoon,
                  message: msg,
                  bureauId: b.id,
                  kandidaatId: k.id,
                });
              } catch (e) {
                console.error("beschikbaarheidCheck", k.id, e);
              }
            }),
          );
        }
      });
    }
  },
);
