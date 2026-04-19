import { serve } from "inngest/next";
import { inngest } from "@/inngest/client";
import { campagneStart, dagrapportCron } from "@/inngest/functions/campagneQueue";

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [campagneStart, dagrapportCron],
});

export const runtime = "nodejs";
