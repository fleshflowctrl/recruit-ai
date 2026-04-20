export type OutboundCallParams = {
  kandidaatId: string;
  telefoon: string;
  campagneId: string;
  bureauNaam: string;
  functie: string;
  screeningVragen: string[];
  salaris: { min: number; max: number };
  beschikbaarheid: string;
  eisen: string;
  /** Telnyx AI stem-id, bijv. nl-NL-Wavenet-A */
  voice?: string;
};

export function buildDutchRecruitmentPrompt(params: OutboundCallParams): string {
  return `
Je bent een professionele recruitment assistent van ${params.bureauNaam}. Je voert een prescreening gesprek in het Nederlands.

FUNCTIE: ${params.functie}
SALARIS: €${params.salaris.min} - €${params.salaris.max}
BESCHIKBAARHEID: ${params.beschikbaarheid}
EISEN: ${params.eisen}

GEDRAGSREGELS:
- Spreek ALTIJD Nederlands
- Wees professioneel maar vriendelijk
- Maximaal 7 minuten per gesprek
- Als kandidaat niet wil: bedank en beëindig
- Stel vragen één voor één
- Wacht op volledig antwoord

VRAGEN (stel ze één voor één):
${params.screeningVragen.map((v, i) => `${i + 1}. ${v}`).join("\n")}

AFSLUITING:
"Hartelijk dank voor uw tijd. Ik stuur uw gegevens door naar onze recruiter. Als u geschikt bent hoort u binnen 2 werkdagen van ons. Fijne dag nog!"
`;
}

/**
 * Start outbound call via Telnyx. Vereist TELNYX_API_KEY, TELNYX_CONNECTION_ID, TELNYX_PHONE_NUMBER.
 * Zet TELNYX_MOCK=true om zonder API-call een fake call id terug te geven (ontwikkeling).
 */
export async function startOutboundCall(
  params: OutboundCallParams,
  options?: { naarTelefoon?: string },
): Promise<{ callId: string }> {
  const dial = options?.naarTelefoon ?? params.telefoon;

  if (process.env.TELNYX_MOCK === "true") {
    return { callId: `mock_${params.kandidaatId}_${Date.now()}` };
  }

  const connectionId = process.env.TELNYX_CONNECTION_ID;
  const apiKey = process.env.TELNYX_API_KEY;
  const from = process.env.TELNYX_PHONE_NUMBER;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  if (!connectionId || !apiKey || !from) {
    throw new Error("Telnyx is niet volledig geconfigureerd (connection / key / nummer)");
  }

  const systemPrompt = buildDutchRecruitmentPrompt(params);
  const firstMessage = `Goedemiddag, u spreekt met de recruitment assistent van ${params.bureauNaam}. Ik bel u in verband met een vacature als ${params.functie}. Heeft u even 5 minuten?`;

  const body = {
    connection_id: connectionId,
    to: dial,
    from,
    webhook_url: `${appUrl}/api/telnyx/webhook`,
    webhook_url_method: "POST",
    custom_headers: [{ name: "Content-Type", value: "application/json" }],
    client_state: Buffer.from(
      JSON.stringify({
        kandidaat_id: params.kandidaatId,
        campagne_id: params.campagneId,
      }),
    ).toString("base64"),
    ai_assistant: {
      voice: params.voice ?? "nl-NL-Wavenet-A",
      language: "nl",
      prompt: systemPrompt,
      first_message: firstMessage,
    },
  };

  const response = await fetch("https://api.telnyx.com/v2/calls", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const data = (await response.json()) as {
    data?: { call_control_id?: string; id?: string };
    errors?: { detail?: string }[];
  };

  if (!response.ok) {
    const msg = data.errors?.[0]?.detail ?? response.statusText;
    throw new Error(`Telnyx: ${msg}`);
  }

  const callId =
    data.data?.call_control_id ?? data.data?.id ?? `telnyx_${Date.now()}`;
  return { callId };
}
