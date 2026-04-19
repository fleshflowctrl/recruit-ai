import { serve } from "inngest/next";
import { inngest } from "@/inngest/client";
import { campagneStart, dagrapportCron } from "@/inngest/functions/campagneQueue";
import { beschikbaarheidCheck } from "@/inngest/functions/beschikbaarheidCheck";
import { noShowPreventie } from "@/inngest/functions/noShowPreventie";
import { inactiveCampagnesCron } from "@/inngest/functions/inactiveCron";

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [
    campagneStart,
    dagrapportCron,
    beschikbaarheidCheck,
    noShowPreventie,
    inactiveCampagnesCron,
  ],
});

export const runtime = "nodejs";
