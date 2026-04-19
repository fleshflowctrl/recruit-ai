export type PlaatsingBevestigingParams = {
  kandidaatNaam: string;
  functie: string;
  bedrijfNaam: string;
  adres: string;
  startdatum: string;
  tijd: string;
  contactpersoon: string;
  contactTelefoon: string;
  meeNemen?: string;
};

async function logOutboundBericht(params: {
  bureauId: string;
  kandidaatId?: string;
  message: string;
  status: "verzonden" | "mislukt";
  telnyxId: string | null;
}) {
  const { createAdminClient } = await import("./supabase/admin");
  const admin = createAdminClient();
  await admin.from("berichten").insert({
    bureau_id: params.bureauId,
    kandidaat_id: params.kandidaatId ?? null,
    kanaal: "whatsapp",
    richting: "outbound",
    inhoud: params.message,
    status: params.status,
    telnyx_message_id: params.telnyxId,
    gelezen: true,
  });
}

/**
 * Telnyx WhatsApp/SMS via Messaging API. Zonder volledige config: mock (log in berichten, geen crash).
 */
export async function sendWhatsApp(params: {
  to: string;
  message: string;
  bureauId: string;
  kandidaatId?: string;
}): Promise<void> {
  const apiKey = process.env.TELNYX_API_KEY;
  const from = process.env.TELNYX_PHONE_NUMBER;
  const messagingProfileId = process.env.TELNYX_MESSAGING_PROFILE_ID;

  const canSendReal =
    Boolean(apiKey && from && messagingProfileId) &&
    process.env.TELNYX_MOCK !== "true";

  if (!apiKey || !from) {
    console.warn(
      "[WhatsApp] TELNYX_API_KEY of TELNYX_PHONE_NUMBER ontbreekt — mock modus",
    );
    await logOutboundBericht({
      bureauId: params.bureauId,
      kandidaatId: params.kandidaatId,
      message: params.message,
      status: "verzonden",
      telnyxId: `mock_${Date.now()}`,
    });
    return;
  }

  if (!messagingProfileId) {
    console.warn(
      "[WhatsApp] TELNYX_MESSAGING_PROFILE_ID ontbreekt — mock verzending, bericht wel gelogd",
    );
    await logOutboundBericht({
      bureauId: params.bureauId,
      kandidaatId: params.kandidaatId,
      message: params.message,
      status: "verzonden",
      telnyxId: `mock_${Date.now()}`,
    });
    return;
  }

  if (!canSendReal) {
    await logOutboundBericht({
      bureauId: params.bureauId,
      kandidaatId: params.kandidaatId,
      message: params.message,
      status: "verzonden",
      telnyxId: `mock_${Date.now()}`,
    });
    return;
  }

  const response = await fetch("https://api.telnyx.com/v2/messages", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: params.to,
      text: params.message,
      messaging_profile_id: messagingProfileId,
      type: "SMS",
    }),
  });

  const data = (await response.json()) as { data?: { id?: string } };

  await logOutboundBericht({
    bureauId: params.bureauId,
    kandidaatId: params.kandidaatId,
    message: params.message,
    status: response.ok ? "verzonden" : "mislukt",
    telnyxId: data?.data?.id ?? null,
  });

  if (!response.ok) {
    throw new Error("WhatsApp-verzending mislukt");
  }
}

export function buildPlaatsingsBevestiging(
  params: PlaatsingBevestigingParams,
): string {
  return `Goedemiddag ${params.kandidaatNaam}! 🎉

Goed nieuws — u bent geselecteerd voor de functie van *${params.functie}* bij *${params.bedrijfNaam}*.

📍 *Adres:* ${params.adres}
📅 *Startdatum:* ${params.startdatum}
⏰ *Tijd:* ${params.tijd}
👤 *Contactpersoon:* ${params.contactpersoon}
📞 *Telefoon:* ${params.contactTelefoon}
${params.meeNemen ? `\n📋 *Meenemen:* ${params.meeNemen}` : ""}

Bevestigt u uw komst door JA te sturen?

Succes gewenst! 🤝
_RecruitAI_`;
}

export function buildBeschikbaarheidCheck(kandidaatNaam: string): string {
  return `Goedemorgen ${kandidaatNaam}! 👋

Dit is een automatisch bericht van uw uitzendbureau.

Bent u beschikbaar deze week voor een opdracht?

Antwoord met:
✅ *JA* — ik ben beschikbaar
❌ *NEE* — ik ben niet beschikbaar

_RecruitAI_`;
}

export function buildNoShowReminder(params: {
  kandidaatNaam: string;
  functie: string;
  bedrijfNaam: string;
  tijd: string;
  adres: string;
}): string {
  return `Goedemiddag ${params.kandidaatNaam}! ⏰

Herinnering: morgen begint uw opdracht als *${params.functie}* bij *${params.bedrijfNaam}*.

⏰ *Tijd:* ${params.tijd}
📍 *Adres:* ${params.adres}

Bevestigt u uw komst met *JA*?

_RecruitAI_`;
}

/** @deprecated Gebruik sendWhatsApp */
export async function sendWhatsAppMessage(opts: {
  to: string;
  from: string;
  text: string;
  messagingProfileId?: string;
  bureauId: string;
  kandidaatId?: string;
}): Promise<{ messageId: string | null }> {
  await sendWhatsApp({
    to: opts.to,
    message: opts.text,
    bureauId: opts.bureauId,
    kandidaatId: opts.kandidaatId,
  });
  return { messageId: null };
}
