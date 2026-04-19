import { Resend } from "resend";
import type { AnalyseResultaat } from "@/lib/types";

function getResend() {
  const key = process.env.RESEND_API_KEY;
  if (!key) return null;
  return new Resend(key);
}

export async function sendGesprekRapportEmail(opts: {
  to: string;
  kandidaatNaam: string;
  functie: string;
  analyse: AnalyseResultaat;
  rapportUrl: string;
}) {
  const resend = getResend();
  if (!resend) {
    console.warn("RESEND_API_KEY ontbreekt; e-mail overgeslagen");
    return { skipped: true as const };
  }

  const { aanbeveling } = opts.analyse;
  const emoji =
    aanbeveling === "GESCHIKT" ? "✅" : aanbeveling === "TWIJFEL" ? "⚠️" : "❌";
  const subject = `${emoji} ${aanbeveling}: ${opts.kandidaatNaam} — ${opts.functie}`;

  const html = `
  <div style="font-family:Inter,system-ui,sans-serif;max-width:560px;margin:0 auto;">
    <div style="background:#0F172A;color:#fff;padding:20px;border-radius:12px 12px 0 0;">
      <h1 style="margin:0;font-size:20px;">RecruitAI</h1>
    </div>
    <div style="padding:24px;border:1px solid #E5E7EB;border-top:none;border-radius:0 0 12px 12px;">
      <p style="font-size:16px;font-weight:600;">Score: ${opts.analyse.score}/10</p>
      <p style="color:#374151;">${opts.analyse.samenvatting}</p>
      <a href="${opts.rapportUrl}" style="display:inline-block;margin-top:16px;padding:12px 20px;background:#2563EB;color:#fff;text-decoration:none;border-radius:12px;font-weight:600;">Bekijk volledig rapport</a>
    </div>
  </div>`;

  await resend.emails.send({
    from: process.env.RESEND_FROM ?? "RecruitAI <onboarding@resend.dev>",
    to: opts.to,
    subject,
    html,
  });

  return { skipped: false as const };
}

export async function sendDagrapportEmail(opts: {
  to: string;
  datumLabel: string;
  totaalGebeld: number;
  geschikt: number;
  nietGeschikt: number;
}) {
  const resend = getResend();
  if (!resend) return { skipped: true as const };

  const subject = `📊 Dagrapport — ${opts.datumLabel}`;
  const html = `
  <div style="font-family:Inter,system-ui,sans-serif;">
    <h2>Dagrapport ${opts.datumLabel}</h2>
    <ul>
      <li>Totaal gebeld: ${opts.totaalGebeld}</li>
      <li>Geschikt: ${opts.geschikt}</li>
      <li>Niet geschikt: ${opts.nietGeschikt}</li>
    </ul>
  </div>`;

  await resend.emails.send({
    from: process.env.RESEND_FROM ?? "RecruitAI <onboarding@resend.dev>",
    to: opts.to,
    subject,
    html,
  });
  return { skipped: false as const };
}
