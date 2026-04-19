/**
 * Telnyx Messaging (WhatsApp) — server-side only.
 */
export async function sendWhatsAppMessage(opts: {
  to: string;
  from: string;
  text: string;
  messagingProfileId?: string;
}): Promise<{ messageId: string | null }> {
  const apiKey = process.env.TELNYX_API_KEY;
  const profileId =
    opts.messagingProfileId ?? process.env.TELNYX_MESSAGING_PROFILE_ID;
  if (!apiKey || !profileId) {
    throw new Error("Telnyx messaging niet geconfigureerd");
  }

  const response = await fetch("https://api.telnyx.com/v2/messages", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: opts.from,
      to: opts.to,
      text: opts.text,
      messaging_profile_id: profileId,
    }),
  });

  const data = (await response.json()) as {
    data?: { id?: string };
  };

  if (!response.ok) {
    throw new Error(`Telnyx messaging mislukt: ${response.statusText}`);
  }

  return { messageId: data.data?.id ?? null };
}
