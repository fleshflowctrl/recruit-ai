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

export async function sendZiekMeldingNaarBureau(opts: {
  bureauEmail: string;
  kandidaatNaam: string;
  bericht: string;
}) {
  const resend = getResend();
  if (!resend) {
    console.warn("RESEND_API_KEY ontbreekt; ziekmelding niet gemaild");
    return { skipped: true as const };
  }

  await resend.emails.send({
    from: process.env.RESEND_FROM ?? "RecruitAI <onboarding@resend.dev>",
    to: opts.bureauEmail,
    subject: `Ziekmelding gemeld — ${opts.kandidaatNaam}`,
    html: `<p>Kandidaat <strong>${opts.kandidaatNaam}</strong> stuurde:</p><blockquote>${opts.bericht}</blockquote>`,
  });
  return { skipped: false as const };
}

export async function sendNoShowAlertNaarBureau(opts: {
  bureauEmail: string;
  kandidaatNaam: string;
}) {
  const resend = getResend();
  if (!resend) return { skipped: true as const };

  const naam = opts.kandidaatNaam;
  const subject = `⚠️ Geen bevestiging van ${naam}`;
  const html = `
  <div style="font-family:Inter,system-ui,sans-serif;max-width:560px;line-height:1.5;">
    <p>Kandidaat <strong>${naam}</strong> heeft de startbevestiging voor morgen nog niet bevestigd.</p>
    <p>Controleer of vervanging nodig is.</p>
  </div>`;

  await resend.emails.send({
    from: process.env.RESEND_FROM ?? "RecruitAI <onboarding@resend.dev>",
    to: opts.bureauEmail,
    subject,
    html,
  });
  return { skipped: false as const };
}

export async function sendDagrapportEmailUitgebreid(opts: {
  to: string;
  datumLabel: string;
  totaalGebeld: number;
  geschikt: number;
  twijfel: number;
  nietGeschikt: number;
  geenGehoor: number;
  topGeschikt: { naam: string; functie?: string }[];
  dashboardUrl: string;
}) {
  const resend = getResend();
  if (!resend) return { skipped: true as const };

  const subject = `📊 Dagrapport ${opts.datumLabel} — RecruitAI`;
  const topLijst =
    opts.topGeschikt.length === 0 ?
      "<li>—</li>"
    : opts.topGeschikt
        .map(
          (t) =>
            `<li><strong>${t.naam}</strong>${t.functie ? ` — ${t.functie}` : ""}</li>`,
        )
        .join("");

  const html = `
  <div style="font-family:Inter,system-ui,sans-serif;max-width:560px;margin:0 auto;">
    <div style="background:#0F172A;color:#fff;padding:20px;border-radius:12px 12px 0 0;">
      <h1 style="margin:0;font-size:20px;">Dagrapport</h1>
      <p style="margin:8px 0 0;font-size:14px;opacity:0.9;">${opts.datumLabel}</p>
    </div>
    <div style="padding:24px;border:1px solid #E5E7EB;border-top:none;border-radius:0 0 12px 12px;">
      <p style="font-size:16px;font-weight:600;">Totaal gebeld vandaag: ${opts.totaalGebeld}</p>
      <ul style="padding-left:20px;color:#374151;">
        <li>Geschikt: ${opts.geschikt}</li>
        <li>Twijfel: ${opts.twijfel}</li>
        <li>Niet geschikt: ${opts.nietGeschikt}</li>
        <li>Geen gehoor: ${opts.geenGehoor}</li>
      </ul>
      <h3 style="margin-top:24px;font-size:15px;">Top 3 geschikte kandidaten</h3>
      <ol style="padding-left:20px;color:#374151;">${topLijst}</ol>
      <a href="${opts.dashboardUrl}" style="display:inline-block;margin-top:20px;padding:12px 20px;background:#2563EB;color:#fff;text-decoration:none;border-radius:12px;font-weight:600;">Naar dashboard</a>
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
