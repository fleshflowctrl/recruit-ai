import { inngest } from "@/inngest/client";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendDagrapportEmailUitgebreid } from "@/lib/email";
import { amsterdamDayRangeIso } from "@/lib/dates/amsterdam";
import { format } from "date-fns";
import { nl } from "date-fns/locale";
import { getFlowSettings, matchesHourMinute } from "@/lib/automatisering";

export const dagrapportCron = inngest.createFunction(
  {
    id: "dagrapport-dagelijks",
    name: "Dagrapport e-mail",
    triggers: [{ cron: "0 * * * *" }],
  },
  async ({ step }) => {
    const bureaus = await step.run("bureaus-met-actieve-campagne", async () => {
      const admin = createAdminClient();
      const { data: actief } = await admin
        .from("campagnes")
        .select("bureau_id")
        .eq("status", "actief");
      const ids = [
        ...new Set((actief ?? []).map((r) => r.bureau_id).filter(Boolean)),
      ] as string[];
      if (!ids.length) return [];

      const { data: bureaus } = await admin
        .from("bureaus")
        .select("id, email, naam")
        .in("id", ids);
      return bureaus ?? [];
    });

    const { start, end } = amsterdamDayRangeIso();
    const datumLabel = format(new Date(), "d MMMM yyyy", { locale: nl });
    const baseUrl =
      process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ??
      "http://localhost:3000";

    const now = new Date();

    for (const b of bureaus) {
      const cfg = await getFlowSettings(b.id);
      if (!cfg.hasOptionalEnabled("dagrapport")) continue;
      if (!matchesHourMinute(now, cfg.dagrapport.tijdstip)) continue;

      const toEmail = cfg.dagrapport.sturenNaarEmail?.trim() || b.email;
      if (!toEmail) continue;

      await step.run(`dagrapport-${b.id}`, async () => {
        const admin = createAdminClient();

        const { data: gesprekken } = await admin
          .from("gesprekken")
          .select("id, aanbeveling, status, kandidaat_id, campagne_id, score")
          .eq("bureau_id", b.id)
          .gte("aangemaakt_op", start)
          .lt("aangemaakt_op", end);

        const rows = gesprekken ?? [];
        const totaalGebeld = rows.length;

        if (
          cfg.dagrapport.alleenBij === "Alleen als er calls waren" &&
          totaalGebeld === 0
        ) {
          return;
        }

        let geschikt = 0;
        let twijfel = 0;
        let nietGeschikt = 0;
        let geenGehoor = 0;

        for (const g of rows) {
          if (g.status === "geen_antwoord") {
            geenGehoor += 1;
            continue;
          }
          if (g.aanbeveling === "GESCHIKT") geschikt += 1;
          else if (g.aanbeveling === "TWIJFEL") twijfel += 1;
          else if (g.aanbeveling === "NIET_GESCHIKT") nietGeschikt += 1;
        }

        const geschiktRows = rows.filter(
          (g) => g.aanbeveling === "GESCHIKT" && g.status === "voltooid",
        );
        const sortedGeschikt = [...geschiktRows].sort(
          (a, b) => (b.score ?? 0) - (a.score ?? 0),
        );
        const topIds = sortedGeschikt.slice(0, 3);

        const kidSet = [
          ...new Set(topIds.map((g) => g.kandidaat_id).filter(Boolean)),
        ] as string[];
        const naamMap: Record<string, string> = {};
        if (kidSet.length) {
          const { data: kands } = await admin
            .from("kandidaten")
            .select("id, naam")
            .in("id", kidSet);
          for (const k of kands ?? []) naamMap[k.id] = k.naam;
        }

        const campagneIds = [
          ...new Set(topIds.map((g) => g.campagne_id).filter(Boolean)),
        ] as string[];
        const vacByCampagne: Record<string, string | null> = {};
        if (campagneIds.length) {
          const { data: camps } = await admin
            .from("campagnes")
            .select("id, vacature_id")
            .in("id", campagneIds);
          for (const c of camps ?? []) vacByCampagne[c.id] = c.vacature_id;
        }
        const vacIds = [
          ...new Set(
            Object.values(vacByCampagne).filter(Boolean),
          ),
        ] as string[];
        const vacMap: Record<string, string> = {};
        if (vacIds.length) {
          const { data: vacs } = await admin
            .from("vacatures")
            .select("id, titel")
            .in("id", vacIds);
          for (const v of vacs ?? []) vacMap[v.id] = v.titel;
        }

        const topGeschikt: { naam: string; functie?: string }[] = topIds.map(
          (g) => {
            const naam =
              g.kandidaat_id ? naamMap[g.kandidaat_id] ?? "Kandidaat" : "Kandidaat";
            let functie: string | undefined;
            if (g.campagne_id && vacByCampagne[g.campagne_id]) {
              const vid = vacByCampagne[g.campagne_id];
              if (vid && vacMap[vid]) functie = vacMap[vid];
            }
            return { naam, functie };
          },
        );

        await sendDagrapportEmailUitgebreid({
          to: toEmail,
          datumLabel,
          totaalGebeld,
          geschikt,
          twijfel,
          nietGeschikt,
          geenGehoor,
          topGeschikt,
          dashboardUrl: `${baseUrl}/dashboard`,
        });
      });
    }
  },
);
