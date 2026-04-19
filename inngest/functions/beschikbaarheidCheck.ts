import { inngest } from "@/inngest/client";
import { createAdminClient } from "@/lib/supabase/admin";
import { buildBeschikbaarheidCheck, sendWhatsApp } from "@/lib/whatsapp";

export const beschikbaarheidCheck = inngest.createFunction(
  {
    id: "beschikbaarheid-check",
    name: "Beschikbaarheid (maandag)",
    triggers: [{ cron: "0 8 * * 1" }],
  },
  async ({ step }) => {
    const bureaus = await step.run("laad-bureaus", async () => {
      const admin = createAdminClient();
      const { data } = await admin.from("bureaus").select("id");
      return data ?? [];
    });

    for (const b of bureaus) {
      await step.run(`whatsapp-bureau-${b.id}`, async () => {
        const admin = createAdminClient();
        const { data: kandidaten } = await admin
          .from("kandidaten")
          .select("id, naam, telefoon")
          .eq("bureau_id", b.id)
          .eq("status", "actief");

        for (const k of kandidaten ?? []) {
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
        }
      });
    }
  },
);
