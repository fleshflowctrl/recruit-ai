import { createAdminClient } from "@/lib/supabase/admin";
import type {
  AiBellenSettings,
  BeschikbaarheidSettings,
  CheckInSettings,
  DagrapportSettings,
  EvaluatieSettings,
  FlowOptionalStep,
  NoShowSettings,
  OptioneelStapKind,
  TriggerSettings,
  UrenSettings,
  WhatsAppBevestigingSettings,
  ZiekteSettings,
} from "@/lib/automatisering-types";

export * from "@/lib/automatisering-types";

export const DEFAULT_TRIGGER: TriggerSettings = {
  triggerType: "Campagne handmatig gestart",
  autoStartCampagne: "Nee — wacht op goedkeuring",
};

export const DEFAULT_AI_BELLEN: AiBellenSettings = {
  stem: "Nederlands vrouwelijk",
  beltijdVan: "09:00",
  beltijdTot: "17:00",
  maxPogingen: 3,
  wachttijdTussenPogingen: "2 uur",
  maxParallel: 3,
};

export const DEFAULT_WHATSAPP: WhatsAppBevestigingSettings = {
  versturenNa: "Direct na bevestiging",
  bevestigingVragen: "Ja — kandidaat moet JA sturen",
};

export const DEFAULT_NO_SHOW: NoShowSettings = {
  beltijd: "17:00",
  dagenVoorStartdatum: "1 dag",
  geenReactieNa: "2 uur",
  dan: "Email alert naar recruiter",
};

export const DEFAULT_BESCHIKBAARHEID: BeschikbaarheidSettings = {
  dag: "Maandag",
  tijdstip: "08:00",
  sturenNaar: "Alleen actieve kandidaten",
};

export const DEFAULT_DAGRAPPORT: DagrapportSettings = {
  tijdstip: "17:00",
  sturenNaarEmail: "",
  alleenBij: "Altijd sturen",
};

export const DEFAULT_CHECK_IN: CheckInSettings = {
  frequentie: "Tweewekelijks",
  dag: "Maandag",
  bellen: "Alleen kandidaat",
};

export const DEFAULT_UREN: UrenSettings = {
  dag: "Vrijdag",
  tijdstip: "16:00",
  via: "WhatsApp",
};

export const DEFAULT_EVALUATIE: EvaluatieSettings = {
  naEindePlaatsing: "Direct",
  bellen: "Alleen kandidaat",
};

export const DEFAULT_ZIEKTE: ZiekteSettings = {
  reactietijd: "Direct",
  alertEmail: "",
};

export const LIBRARY_BLOCKS: {
  kind: OptioneelStapKind;
  naam: string;
  emoji: string;
  subtitle: string;
  chipClass: string;
}[] = [
  {
    kind: "no_show",
    naam: "No-show preventie",
    emoji: "⏰",
    subtitle: "Dag voor startdatum",
    chipClass: "bg-amber-100 text-amber-900 ring-amber-200",
  },
  {
    kind: "beschikbaarheid",
    naam: "Beschikbaarheid check",
    emoji: "📅",
    subtitle: "Elke maandag 08:00",
    chipClass: "bg-violet-100 text-violet-900 ring-violet-200",
  },
  {
    kind: "check_in",
    naam: "Check-in call",
    emoji: "🤝",
    subtitle: "Elke 2 weken",
    chipClass: "bg-pink-100 text-pink-900 ring-pink-200",
  },
  {
    kind: "uren",
    naam: "Uren ophalen",
    emoji: "🕐",
    subtitle: "Elke vrijdag 16:00",
    chipClass: "bg-orange-100 text-orange-900 ring-orange-200",
  },
  {
    kind: "evaluatie",
    naam: "Evaluatie call",
    emoji: "⭐",
    subtitle: "Na einde plaatsing",
    chipClass: "bg-blue-100 text-blue-900 ring-blue-200",
  },
  {
    kind: "dagrapport",
    naam: "Dagrapport email",
    emoji: "📊",
    subtitle: "Elke dag 17:00",
    chipClass: "bg-emerald-100 text-emerald-900 ring-emerald-200",
  },
  {
    kind: "ziekte",
    naam: "Ziekte vervanger",
    emoji: "🏥",
    subtitle: "Bij ziekmelding",
    chipClass: "bg-red-100 text-red-900 ring-red-200",
  },
];

export function defaultOptionalSettings(kind: OptioneelStapKind): Record<string, unknown> {
  switch (kind) {
    case "no_show":
      return { ...DEFAULT_NO_SHOW };
    case "beschikbaarheid":
      return { ...DEFAULT_BESCHIKBAARHEID };
    case "check_in":
      return { ...DEFAULT_CHECK_IN };
    case "uren":
      return { ...DEFAULT_UREN };
    case "evaluatie":
      return { ...DEFAULT_EVALUATIE };
    case "dagrapport":
      return { ...DEFAULT_DAGRAPPORT };
    case "ziekte":
      return { ...DEFAULT_ZIEKTE };
  }
}

export type ResolvedAutomatisering = {
  flow: FlowOptionalStep[];
  trigger: TriggerSettings;
  aiBellen: AiBellenSettings;
  whatsapp: WhatsAppBevestigingSettings;
  /** Instellingen voor eerste optionele stap van dit kind (enabled + in flow) */
  noShow: NoShowSettings;
  beschikbaarheid: BeschikbaarheidSettings;
  dagrapport: DagrapportSettings;
  hasOptionalEnabled: (kind: OptioneelStapKind) => boolean;
};

function parseFlow(raw: unknown): FlowOptionalStep[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((r) => {
      if (!r || typeof r !== "object") return null;
      const o = r as Record<string, unknown>;
      if (typeof o.id !== "string" || typeof o.kind !== "string") return null;
      return {
        id: o.id,
        kind: o.kind as OptioneelStapKind,
        enabled: Boolean(o.enabled),
      };
    })
    .filter(Boolean) as FlowOptionalStep[];
}

function optSettingsForKind(
  flow: FlowOptionalStep[],
  settings: Record<string, unknown>,
  kind: OptioneelStapKind,
  defaults: unknown,
): unknown {
  const step = flow.find((s) => s.kind === kind && s.enabled);
  if (!step) return defaults;
  const raw = settings[step.id];
  if (!raw || typeof raw !== "object") return defaults;
  return { ...(defaults as object), ...(raw as object) };
}

/** Telnyx AI stem id */
export function stemToVoiceId(stem: AiBellenSettings["stem"]): string {
  if (stem === "Nederlands mannelijk") return "nl-NL-Wavenet-D";
  return "nl-NL-Wavenet-A";
}

export function wachttijdToInngestDuration(
  w: AiBellenSettings["wachttijdTussenPogingen"],
): string {
  switch (w) {
    case "30 minuten":
      return "30m";
    case "1 uur":
      return "1h";
    case "4 uur":
      return "4h";
    default:
      return "2h";
  }
}

export function geenReactieNaToSleep(no: NoShowSettings["geenReactieNa"]): string {
  switch (no) {
    case "1 uur":
      return "1h";
    case "4 uur":
      return "4h";
    default:
      return "2h";
  }
}

export function parseTimeToHourMinute(t: string): { h: number; m: number } {
  const [a, b] = t.split(":").map((x) => parseInt(x, 10));
  const h = Number.isFinite(a) ? a : 9;
  const m = Number.isFinite(b) ? b : 0;
  return { h: Math.min(23, Math.max(0, h)), m: Math.min(59, Math.max(0, m)) };
}

/** Buiten dit venster (Europe/Amsterdam) niet bellen */
export function isWithinBeltijdVenster(now: Date, van: string, tot: string): boolean {
  const fmt = new Intl.DateTimeFormat("nl-NL", {
    timeZone: "Europe/Amsterdam",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  const parts = fmt.formatToParts(now);
  const hh = parseInt(parts.find((p) => p.type === "hour")?.value ?? "12", 10);
  const mm = parseInt(parts.find((p) => p.type === "minute")?.value ?? "0", 10);
  const cur = hh * 60 + mm;
  const v = parseTimeToHourMinute(van);
  const t = parseTimeToHourMinute(tot);
  const start = v.h * 60 + v.m;
  const end = t.h * 60 + t.m;
  if (start <= end) return cur >= start && cur <= end;
  return cur >= start || cur <= end;
}

/** Map English weekday from Intl (Amsterdam) to Dutch labels used in UI */
export function weekdayNlFromDate(d: Date): string {
  const fmt = new Intl.DateTimeFormat("en-US", {
    timeZone: "Europe/Amsterdam",
    weekday: "long",
  });
  const en = fmt.format(d);
  const map: Record<string, string> = {
    Monday: "Maandag",
    Tuesday: "Dinsdag",
    Wednesday: "Woensdag",
    Thursday: "Donderdag",
    Friday: "Vrijdag",
    Saturday: "Zaterdag",
    Sunday: "Zondag",
  };
  return map[en] ?? "Maandag";
}

export function computeNoShowReminderAt(
  startdatumIso: string,
  dagen: NoShowSettings["dagenVoorStartdatum"],
  beltijd: string,
): Date | null {
  const days = dagen === "3 dagen" ? 3 : dagen === "2 dagen" ? 2 : 1;
  const [y, m, d] = startdatumIso.split("-").map(Number);
  if (!y || !m || !d) return null;
  const start = new Date(y, m - 1, d);
  const reminder = new Date(start);
  reminder.setDate(reminder.getDate() - days);
  const { h, m: min } = parseTimeToHourMinute(beltijd);
  reminder.setHours(h, min, 0, 0);
  return reminder;
}

export function matchesDagEnTijd(
  now: Date,
  dag: BeschikbaarheidSettings["dag"],
  tijdstip: string,
): boolean {
  const wd = weekdayNlFromDate(now);
  if (wd !== dag) return false;
  const { h, m } = parseTimeToHourMinute(tijdstip);
  const fmt = new Intl.DateTimeFormat("nl-NL", {
    timeZone: "Europe/Amsterdam",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  const parts = fmt.formatToParts(now);
  const hh = parseInt(parts.find((p) => p.type === "hour")?.value ?? "0", 10);
  const mm = parseInt(parts.find((p) => p.type === "minute")?.value ?? "0", 10);
  return hh === h && mm === m;
}

export function matchesHourMinute(now: Date, tijdstip: string): boolean {
  const { h, m } = parseTimeToHourMinute(tijdstip);
  const fmt = new Intl.DateTimeFormat("nl-NL", {
    timeZone: "Europe/Amsterdam",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  const parts = fmt.formatToParts(now);
  const hh = parseInt(parts.find((p) => p.type === "hour")?.value ?? "0", 10);
  const mm = parseInt(parts.find((p) => p.type === "minute")?.value ?? "0", 10);
  return hh === h && mm === m;
}

function mergeTrigger(s: Record<string, unknown>): TriggerSettings {
  return { ...DEFAULT_TRIGGER, ...(s.trigger as object) } as TriggerSettings;
}

function mergeAi(s: Record<string, unknown>): AiBellenSettings {
  return { ...DEFAULT_AI_BELLEN, ...(s.ai_bellen as object) } as AiBellenSettings;
}

function mergeWa(s: Record<string, unknown>): WhatsAppBevestigingSettings {
  return { ...DEFAULT_WHATSAPP, ...(s.whatsapp as object) } as WhatsAppBevestigingSettings;
}

/**
 * Laadt flow + instellingen voor een bureau (service role / server).
 * Gebruikt door Inngest-functies en API.
 */
export async function getFlowSettings(bureauId: string): Promise<ResolvedAutomatisering> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("automatisering_flows")
    .select("flow, settings")
    .eq("bureau_id", bureauId)
    .maybeSingle();

  const flow = parseFlow(data?.flow);
  const settings = (data?.settings && typeof data.settings === "object"
    ? (data.settings as Record<string, unknown>)
    : {}) as Record<string, unknown>;

  const trigger = mergeTrigger(settings);
  const aiBellen = mergeAi(settings);
  const whatsapp = mergeWa(settings);

  const noShow = optSettingsForKind(
    flow,
    settings,
    "no_show",
    DEFAULT_NO_SHOW,
  ) as NoShowSettings;

  const beschikbaarheid = optSettingsForKind(
    flow,
    settings,
    "beschikbaarheid",
    DEFAULT_BESCHIKBAARHEID,
  ) as BeschikbaarheidSettings;

  const dagrapport = optSettingsForKind(
    flow,
    settings,
    "dagrapport",
    DEFAULT_DAGRAPPORT,
  ) as DagrapportSettings;

  function hasOptionalEnabled(kind: OptioneelStapKind): boolean {
    return flow.some((s) => s.kind === kind && s.enabled);
  }

  return {
    flow,
    trigger,
    aiBellen,
    whatsapp,
    noShow,
    beschikbaarheid,
    dagrapport,
    hasOptionalEnabled,
  };
}
