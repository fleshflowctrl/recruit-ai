import { Inngest } from "inngest";

/**
 * Lokaal (`next dev`): `isDev: true` → geen cloud INNGEST_EVENT_KEY nodig.
 * Start wel de Dev Server: `npx inngest-cli@latest dev` (en laat `/api/inngest` bereikbaar).
 * Productie: zet INNGEST_EVENT_KEY (of deploy met Inngest).
 */
const isDevMode =
  process.env.NODE_ENV === "development" || process.env.INNGEST_DEV === "1";

export const inngest = new Inngest({
  id: "recruitai",
  name: "RecruitAI",
  eventKey: process.env.INNGEST_EVENT_KEY,
  isDev: isDevMode,
});
