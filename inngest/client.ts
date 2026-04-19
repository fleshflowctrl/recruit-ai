import { Inngest } from "inngest";

export const inngest = new Inngest({
  id: "recruitai",
  name: "RecruitAI",
  eventKey: process.env.INNGEST_EVENT_KEY,
});
