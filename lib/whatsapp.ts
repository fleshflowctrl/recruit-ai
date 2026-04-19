import { createAdminClient } from "@/lib/supabase/admin";

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

/**
 * Telnyx Messaging (WhatsApp) — server-side only.
 * Zet TELNYX_MOCK=true om geen echte API-call te doen; bericht wordt wel gelogd.
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

  const mock = process.env.TELNYX_MOCK === "true";

  if (!mock && (!apiKey || !from || !messagingProfileId)) {
    throw new Error("WhatsApp niet geconfigureerd");
  }

  let responseOk = mock;
  let data: { data?: { id?: string } } = {};

  if (!mock) {
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
    data = (await response.json()) as { data?: { id?: string } };
    responseOk = response.ok;
    if (!response.ok) {
      const admin = createAdminClient();
      await admin.from("berichten").insert({
        bureau_id: params.bureauId,
        kandidaat_id: params.kandidaatId ?? null,
        kanaal: "whatsapp",
        richting: "outbound",
        inhoud: params.message,
        status: "mislukt",
        telnyx_message_id: data?.data?.id ?? null,
        gelezen: true,
      });
      throw new Error("WhatsApp-verzending mislukt");
    }
  }

  const admin = createAdminClient();
  await admin.from("berichten").insert({
    bureau_id: params.bureauId,
    kandidaat_id: params.kandidaatId ?? null,
    kanaal: "whatsapp",
    richting: "outbound",
    inhoud: params.message,
    status: responseOk ? "verzonden" : "mislukt",
    telnyx_message_id: mock ? `mock_${Date.now()}` : (data?.data?.id ?? null),
    gelezen: true,
  });
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
