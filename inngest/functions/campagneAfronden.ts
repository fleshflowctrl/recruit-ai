import { inngest } from "@/inngest/client";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Dagelijks 09:00 — actieve campagnes zonder openstaande wacht/bezig-kandidaten afsluiten.
 */
export const campagneAfronden = inngest.createFunction(
  {
    id: "campagne-afronden",
    name: "Campagne afronden (geen wacht/bezig)",
    triggers: [{ cron: "0 9 * * *" }],
  },
  async ({ step }) => {
    await step.run("markeer-afgerond", async () => {
      const admin = createAdminClient();
      const { data: campagnes } = await admin
        .from("campagnes")
        .select("id")
        .eq("status", "actief");

      for (const c of campagnes ?? []) {
        const { data: pending } = await admin
          .from("campagne_kandidaten")
          .select("id")
          .eq("campagne_id", c.id)
          .in("status", ["wacht", "bezig"])
          .limit(1);

        if (!pending?.length) {
          await admin
            .from("campagnes")
            .update({ status: "afgerond" })
            .eq("id", c.id);
        }
      }
    });
  },
);
