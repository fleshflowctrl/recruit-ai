import { inngest } from "@/inngest/client";
import { createAdminClient } from "@/lib/supabase/admin";
import { buildNoShowReminder, sendWhatsApp } from "@/lib/whatsapp";
import { sendNoShowAlertNaarBureau } from "@/lib/email";

type PlaatsingEvent = {
  plaatsingId: string;
  bureauId: string;
  kandidaatId: string;
  startdatum: string;
  reminderAt: string | null;
  bedrijfNaam: string;
  tijd: string;
};

function reminderDayBeforeAt17(startdatum: string): Date | null {
  const [y, m, d] = startdatum.split("-").map(Number);
  if (!y || !m || !d) return null;
  const start = new Date(y, m - 1, d);
  const reminder = new Date(start);
  reminder.setDate(reminder.getDate() - 1);
  reminder.setHours(17, 0, 0, 0);
  return reminder;
}

export const noShowPreventie = inngest.createFunction(
  {
    id: "no-show-preventie",
    name: "No-show preventie",
    triggers: [{ event: "plaatsing/created" }],
  },
  async ({ event, step }) => {
    const data = event.data as PlaatsingEvent;
    const { plaatsingId, bureauId, kandidaatId, startdatum, tijd } = data;

    const ctx = await step.run("laad-plaatsing-context", async () => {
      const admin = createAdminClient();
      const { data: plaatsing } = await admin
        .from("plaatsingen")
        .select(
          "id, startdatum, vacature_id, opdrachtgever_id, kandidaat_id, bureau_id",
        )
        .eq("id", plaatsingId)
        .single();

      if (!plaatsing) return null;

      const { data: kandidaat } = await admin
        .from("kandidaten")
        .select("naam, telefoon")
        .eq("id", kandidaatId)
        .single();

      let functieTitel = "Opdracht";
      let bedrijfNaam = data.bedrijfNaam;
      let adres = "—";

      if (plaatsing.vacature_id) {
        const { data: vac } = await admin
          .from("vacatures")
          .select("titel, locatie, opdrachtgever_id")
          .eq("id", plaatsing.vacature_id)
          .single();
        if (vac?.titel) functieTitel = vac.titel;
        if (vac?.locatie) adres = vac.locatie;
        if (vac?.opdrachtgever_id) {
          const { data: og } = await admin
            .from("opdrachtgevers")
            .select("naam, adres")
            .eq("id", vac.opdrachtgever_id)
            .single();
          if (og?.naam) bedrijfNaam = og.naam;
          if (og?.adres) adres = og.adres;
        }
      }

      const start = plaatsing.startdatum ?? startdatum;
      let target: Date | null = data.reminderAt ? new Date(data.reminderAt) : null;
      if (!target || Number.isNaN(target.getTime())) {
        target = start ? reminderDayBeforeAt17(String(start)) : null;
      }

      return {
        kandidaat,
        functieTitel,
        bedrijfNaam,
        adres,
        reminderTarget: target,
      };
    });

    if (!ctx?.kandidaat?.telefoon) {
      return { ok: false, reason: "geen-kandidaat" };
    }

    const target =
      ctx.reminderTarget != null ?
        new Date(ctx.reminderTarget as Date | string)
      : null;
    if (target && !Number.isNaN(target.getTime()) && target.getTime() > Date.now()) {
      await step.sleepUntil("tot-herinnering-tijd", target);
    }

    await step.run("whatsapp-herinnering", async () => {
      const admin = createAdminClient();
      const msg = buildNoShowReminder({
        kandidaatNaam: ctx.kandidaat!.naam,
        functie: ctx.functieTitel,
        bedrijfNaam: ctx.bedrijfNaam,
        tijd,
        adres: ctx.adres,
      });
      try {
        await sendWhatsApp({
          to: ctx.kandidaat!.telefoon,
          message: msg,
          bureauId,
          kandidaatId,
        });
      } catch (e) {
        console.error("noShow whatsapp", e);
      }
    });

    await step.sleep("wacht-twee-uur", "2h");

    await step.run("check-bevestiging-email", async () => {
      const admin = createAdminClient();
      const { data: plaatsing } = await admin
        .from("plaatsingen")
        .select("status")
        .eq("id", plaatsingId)
        .single();

      if (plaatsing?.status === "bevestigd_door_kandidaat") {
        return;
      }

      const { data: bureau } = await admin
        .from("bureaus")
        .select("email")
        .eq("id", bureauId)
        .single();
      const { data: kandidaat } = await admin
        .from("kandidaten")
        .select("naam")
        .eq("id", kandidaatId)
        .single();

      const naam = kandidaat?.naam ?? "Kandidaat";
      if (bureau?.email) {
        await sendNoShowAlertNaarBureau({
          bureauEmail: bureau.email,
          kandidaatNaam: naam,
        });
      }
    });
  },
);
