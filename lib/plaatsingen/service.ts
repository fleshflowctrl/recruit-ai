import type { SupabaseClient } from "@supabase/supabase-js";
import type { Plaatsing } from "@/lib/types";
import { inngest } from "@/inngest/client";
import { buildPlaatsingsBevestiging, sendWhatsApp } from "@/lib/whatsapp";
import { format } from "date-fns";
import { nl } from "date-fns/locale";

export type CreatePlaatsingInput = {
  bureauId: string;
  kandidaatId: string;
  vacatureId: string;
  opdrachtgeverId: string;
  startdatum: string;
  einddatum: string | null;
  starttijd: string;
  adres: string;
  contactpersoon: string;
  contactTelefoon: string;
  meeNemen?: string | null;
  campagneId?: string | null;
  kandidaatNaam: string;
  functieTitel: string;
  bedrijfNaam: string;
  uurtarief_kandidaat?: number | null;
  uurtarief_opdrachtgever?: number | null;
};

function reminderDayBeforeAt17(startdatum: string): string | null {
  const [y, m, d] = startdatum.split("-").map(Number);
  if (!y || !m || !d) return null;
  const start = new Date(y, m - 1, d);
  const reminder = new Date(start);
  reminder.setDate(reminder.getDate() - 1);
  reminder.setHours(17, 0, 0, 0);
  return reminder.toISOString();
}

/**
 * Plaatsing aanmaken + kandidaat geplaatst + optioneel campagne_kandidaat + WhatsApp + Inngest.
 */
export async function createPlaatsingWithSideEffects(
  supabase: SupabaseClient,
  input: CreatePlaatsingInput,
  options?: { updateCampagneKandidaat?: boolean; campagneId?: string | null },
): Promise<{ plaatsing: Plaatsing }> {
  const { data: plaatsing, error: pErr } = await supabase
    .from("plaatsingen")
    .insert({
      bureau_id: input.bureauId,
      vacature_id: input.vacatureId,
      kandidaat_id: input.kandidaatId,
      opdrachtgever_id: input.opdrachtgeverId,
      startdatum: input.startdatum,
      einddatum: input.einddatum,
      status: "bevestigd",
      uurtarief_kandidaat: input.uurtarief_kandidaat ?? undefined,
      uurtarief_opdrachtgever: input.uurtarief_opdrachtgever ?? undefined,
    })
    .select("*")
    .single();

  if (pErr || !plaatsing) {
    throw new Error(pErr?.message ?? "Plaatsing opslaan mislukt");
  }

  await supabase
    .from("kandidaten")
    .update({ status: "geplaatst" })
    .eq("id", input.kandidaatId);

  const campagneId = options?.campagneId ?? input.campagneId;
  if (options?.updateCampagneKandidaat && campagneId) {
    await supabase
      .from("campagne_kandidaten")
      .update({ status: "geschikt" })
      .eq("campagne_id", campagneId)
      .eq("kandidaat_id", input.kandidaatId);
  }

  const startLabel = format(
    new Date(`${input.startdatum}T12:00:00`),
    "d MMMM yyyy",
    { locale: nl },
  );

  const msg = buildPlaatsingsBevestiging({
    kandidaatNaam: input.kandidaatNaam,
    functie: input.functieTitel,
    bedrijfNaam: input.bedrijfNaam,
    adres: input.adres,
    startdatum: startLabel,
    tijd: input.starttijd,
    contactpersoon: input.contactpersoon,
    contactTelefoon: input.contactTelefoon,
    meeNemen: input.meeNemen ?? undefined,
  });

  const { data: kandidaat } = await supabase
    .from("kandidaten")
    .select("telefoon")
    .eq("id", input.kandidaatId)
    .single();

  if (kandidaat?.telefoon) {
    try {
      await sendWhatsApp({
        to: kandidaat.telefoon,
        message: msg,
        bureauId: input.bureauId,
        kandidaatId: input.kandidaatId,
      });
    } catch (e) {
      console.error("WhatsApp na plaatsing:", e);
    }
  }

  const reminderAt = reminderDayBeforeAt17(input.startdatum);

  try {
    await inngest.send({
      name: "plaatsing/created",
      data: {
        plaatsingId: plaatsing.id as string,
        bureauId: input.bureauId,
        kandidaatId: input.kandidaatId,
        startdatum: input.startdatum,
        reminderAt,
        bedrijfNaam: input.bedrijfNaam,
        tijd: input.starttijd,
      },
    });
  } catch (e) {
    console.error("Inngest plaatsing/created:", e);
  }

  return { plaatsing: plaatsing as Plaatsing };
}
