import { inngest } from "@/inngest/client";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendWhatsApp } from "@/lib/whatsapp";
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

export const noShowPreventie = inngest.createFunction(
  {
    id: "no-show-preventie",
    name: "No-show preventie",
    triggers: [{ event: "plaatsing/created" }],
  },
  async ({ event, step }) => {
    const data = event.data as PlaatsingEvent;
    const { reminderAt, bureauId, kandidaatId, bedrijfNaam, tijd } = data;

    if (reminderAt) {
      const target = new Date(reminderAt);
      if (target.getTime() > Date.now()) {
        await step.sleepUntil("tot-herinnering-tijd", target);
      }
    }

    await step.run("whatsapp-herinnering", async () => {
      const admin = createAdminClient();
      const { data: k } = await admin
        .from("kandidaten")
        .select("naam, telefoon")
        .eq("id", kandidaatId)
        .single();
      if (!k) return;
      const msg = `Herinnering: morgen om ${tijd} bij ${bedrijfNaam}. Bevestigt u met JA?`;
      try {
        await sendWhatsApp({
          to: k.telefoon,
          message: msg,
          bureauId,
          kandidaatId,
        });
      } catch (e) {
        console.error("noShow whatsapp", e);
      }
    });

    await step.sleep("wacht-twee-uur", "2h");

    await step.run("check-antwoord", async () => {
      const admin = createAdminClient();
      const sinds = new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString();
      const { data: inbound } = await admin
        .from("berichten")
        .select("inhoud")
        .eq("kandidaat_id", kandidaatId)
        .eq("richting", "inbound")
        .gte("aangemaakt_op", sinds);

      const heeftJa = (inbound ?? []).some((b) =>
        /^ja$/i.test(String(b.inhoud).trim()),
      );
      if (heeftJa) return;

      const { data: bureau } = await admin
        .from("bureaus")
        .select("email")
        .eq("id", bureauId)
        .single();
      const { data: k } = await admin
        .from("kandidaten")
        .select("naam")
        .eq("id", kandidaatId)
        .single();

      if (bureau?.email) {
        await sendNoShowAlertNaarBureau({
          bureauEmail: bureau.email,
          kandidaatNaam: k?.naam ?? "Kandidaat",
        });
      }
    });
  },
);
