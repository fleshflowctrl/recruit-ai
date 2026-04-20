/** Vaste stappen (niet in flow JSON, wel in settings) */
export type VasteStapId = "trigger" | "ai_bellen" | "whatsapp";

/** Optionele bibliotheek-stappen */
export type OptioneelStapKind =
  | "no_show"
  | "beschikbaarheid"
  | "check_in"
  | "uren"
  | "evaluatie"
  | "dagrapport"
  | "ziekte";

export type FlowOptionalStep = {
  id: string;
  kind: OptioneelStapKind;
  enabled: boolean;
};

export type TriggerSettings = {
  triggerType:
    | "Campagne handmatig gestart"
    | "Nieuwe vacature aangemaakt"
    | "Opdracht via WhatsApp";
  autoStartCampagne: "Nee — wacht op goedkeuring" | "Ja — direct starten";
};

export type AiBellenSettings = {
  stem: "Nederlands vrouwelijk" | "Nederlands mannelijk";
  beltijdVan: string;
  beltijdTot: string;
  maxPogingen: 1 | 2 | 3 | 4 | 5;
  wachttijdTussenPogingen:
    | "30 minuten"
    | "1 uur"
    | "2 uur"
    | "4 uur";
  maxParallel: 1 | 2 | 3 | 5 | 10;
};

export type WhatsAppBevestigingSettings = {
  versturenNa:
    | "Direct na bevestiging"
    | "1 uur na bevestiging"
    | "Volgende ochtend 09:00";
  bevestigingVragen:
    | "Ja — kandidaat moet JA sturen"
    | "Nee — alleen informeren";
};

export type NoShowSettings = {
  beltijd: string;
  dagenVoorStartdatum: "1 dag" | "2 dagen" | "3 dagen";
  geenReactieNa: "1 uur" | "2 uur" | "4 uur";
  dan: "Email alert naar recruiter" | "Automatisch vervanger zoeken";
};

export type BeschikbaarheidSettings = {
  dag: "Maandag" | "Dinsdag" | "Vrijdag";
  tijdstip: string;
  sturenNaar: "Alleen actieve kandidaten" | "Alle kandidaten";
};

export type CheckInSettings = {
  frequentie: "Wekelijks" | "Tweewekelijks" | "Maandelijks";
  dag: "Maandag" | "Woensdag" | "Vrijdag";
  bellen: "Alleen kandidaat" | "Kandidaat + opdrachtgever";
};

export type UrenSettings = {
  dag: "Donderdag" | "Vrijdag";
  tijdstip: string;
  via: "WhatsApp" | "Email" | "WhatsApp + Email";
};

export type EvaluatieSettings = {
  naEindePlaatsing: "Direct" | "Na 1 dag" | "Na 3 dagen";
  bellen: "Alleen kandidaat" | "Kandidaat + opdrachtgever";
};

export type DagrapportSettings = {
  tijdstip: string;
  sturenNaarEmail: string;
  alleenBij: "Altijd sturen" | "Alleen als er calls waren";
};

export type ZiekteSettings = {
  reactietijd: "Direct" | "Na 30 minuten" | "Na 1 uur";
  alertEmail: string;
};

export type StepSettingsMap = {
  trigger: TriggerSettings;
  ai_bellen: AiBellenSettings;
  whatsapp: WhatsAppBevestigingSettings;
} & Record<string, unknown>;

export type AutomatiseringRow = {
  id: string;
  bureau_id: string;
  flow: FlowOptionalStep[];
  settings: Record<string, unknown>;
  aangemaakt_op: string;
  bijgewerkt_op: string;
};
