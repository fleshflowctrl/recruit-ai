export type PlanType = "trial" | "starter" | "professional" | "enterprise";

export type KandidaatStatus = "actief" | "inactief" | "geplaatst";
export type VacatureStatus = "open" | "gesloten" | "geannuleerd";
export type CampagneStatus = "concept" | "actief" | "gepauzeerd" | "afgerond" | "gestopt";
export type CampagneKandidaatStatus =
  | "wacht"
  | "bezig"
  | "geschikt"
  | "twijfel"
  | "niet_geschikt"
  | "geen_gehoor";
export type GesprekStatus =
  | "gepland"
  | "bezig"
  | "voltooid"
  | "mislukt"
  | "geen_antwoord";

export type AanbevelingType = "GESCHIKT" | "TWIJFEL" | "NIET_GESCHIKT";

export interface Bureau {
  id: string;
  naam: string;
  email: string;
  telefoon: string | null;
  logo_url: string | null;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  plan: PlanType | string;
  credits_resterend: number;
  telnyx_nummer: string | null;
  whatsapp_nummer: string | null;
  aangemaakt_op: string;
}

export interface Profile {
  id: string;
  bureau_id: string;
  volledige_naam: string | null;
  rol: string | null;
  aangemaakt_op: string;
}

export interface Kandidaat {
  id: string;
  bureau_id: string;
  naam: string;
  telefoon: string;
  email: string | null;
  rijbewijs: boolean;
  beschikbaar_per: string | null;
  salariswens_min: number | null;
  salariswens_max: number | null;
  sectoren: string[] | null;
  skills: string[] | null;
  status: string;
  notities: string | null;
  laatste_contact: string | null;
  aangemaakt_op: string;
}

export interface Opdrachtgever {
  id: string;
  bureau_id: string;
  naam: string;
  contactpersoon: string | null;
  email: string | null;
  telefoon: string | null;
  adres: string | null;
  sector: string | null;
  notities: string | null;
  aangemaakt_op: string;
}

export interface Vacature {
  id: string;
  bureau_id: string;
  opdrachtgever_id: string | null;
  titel: string;
  omschrijving: string | null;
  locatie: string | null;
  sector: string | null;
  uren_per_week: number | null;
  salaris_min: number | null;
  salaris_max: number | null;
  startdatum: string | null;
  einddatum: string | null;
  aantal_gezocht: number;
  eisen: string[] | null;
  status: string;
  aangemaakt_op: string;
}

export interface Campagne {
  id: string;
  bureau_id: string;
  vacature_id: string | null;
  naam: string;
  type: string;
  status: string;
  script: string | null;
  screening_vragen: unknown;
  rapport_email: string | null;
  totaal_kandidaten: number;
  gebeld: number;
  geschikt: number;
  niet_geschikt: number;
  twijfel: number;
  geen_gehoor: number;
  aangemaakt_op: string;
}

export interface CampagneKandidaat {
  id: string;
  campagne_id: string;
  kandidaat_id: string;
  status: string;
  bel_pogingen: number;
  volgende_bel_poging: string | null;
  aangemaakt_op: string;
}

export interface Gesprek {
  id: string;
  campagne_id: string | null;
  kandidaat_id: string | null;
  bureau_id: string | null;
  telnyx_call_id: string | null;
  status: string;
  duur_seconden: number | null;
  transcript: string | null;
  opname_url: string | null;
  score: number | null;
  aanbeveling: string | null;
  samenvatting: string | null;
  antwoorden: Record<string, string> | null;
  positieve_punten: string[] | null;
  negatieve_punten: string[] | null;
  bel_poging: number;
  aangemaakt_op: string;
}

export interface Plaatsing {
  id: string;
  bureau_id: string;
  vacature_id: string | null;
  kandidaat_id: string | null;
  opdrachtgever_id: string | null;
  startdatum: string | null;
  einddatum: string | null;
  uurtarief_kandidaat: string | null;
  uurtarief_opdrachtgever: string | null;
  status: string;
  aangemaakt_op: string;
}

export interface Bericht {
  id: string;
  bureau_id: string;
  kandidaat_id: string | null;
  kanaal: string;
  richting: string;
  inhoud: string;
  status: string;
  telnyx_message_id: string | null;
  aangemaakt_op: string;
  gelezen?: boolean | null;
}

export interface AnalyseResultaat {
  score: number;
  aanbeveling: AanbevelingType;
  samenvatting: string;
  antwoorden: Record<string, string>;
  positieve_punten: string[];
  negatieve_punten: string[];
}
