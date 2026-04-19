import { inngest } from "@/inngest/client";
import { createAdminClient } from "@/lib/supabase/admin";

export const inactiveCampagnesCron = inngest.createFunction(
  {
    id: "inactive-campagnes-cron",
    name: "Campagnes zonder wacht auto-afsluiten",
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
        const { count } = await admin
          .from("campagne_kandidaten")
          .select("*", { count: "exact", head: true })
          .eq("campagne_id", c.id)
          .eq("status", "wacht");

        if (count === 0) {
          await admin
            .from("campagnes")
            .update({ status: "afgerond" })
            .eq("id", c.id);
        }
      }
    });
  },
);
