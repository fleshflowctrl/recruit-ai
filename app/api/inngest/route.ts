import { serve } from "inngest/next";
import { inngest } from "@/inngest/client";
import { campagneStart } from "@/inngest/functions/campagneQueue";
import { beschikbaarheidCheck } from "@/inngest/functions/beschikbaarheidCheck";
import { noShowPreventie } from "@/inngest/functions/noShowPreventie";
import { campagneAfronden } from "@/inngest/functions/campagneAfronden";
import { dagrapportCron } from "@/inngest/functions/dagrapport";

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [
    campagneStart,
    dagrapportCron,
    beschikbaarheidCheck,
    noShowPreventie,
    campagneAfronden,
  ],
});

export const runtime = "nodejs";
