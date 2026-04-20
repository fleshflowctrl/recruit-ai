"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import type { OptioneelStapKind, VasteStapId } from "@/lib/automatisering-types";
import type {
  AiBellenSettings,
  BeschikbaarheidSettings,
  CheckInSettings,
  DagrapportSettings,
  EvaluatieSettings,
  NoShowSettings,
  TriggerSettings,
  UrenSettings,
  WhatsAppBevestigingSettings,
  ZiekteSettings,
} from "@/lib/automatisering-types";
import {
  DEFAULT_AI_BELLEN,
  DEFAULT_BESCHIKBAARHEID,
  DEFAULT_EVALUATIE,
  DEFAULT_NO_SHOW,
  DEFAULT_TRIGGER,
  DEFAULT_UREN,
  DEFAULT_WHATSAPP,
  DEFAULT_ZIEKTE,
  LIBRARY_BLOCKS,
  DEFAULT_CHECK_IN,
  DEFAULT_DAGRAPPORT,
} from "@/lib/automatisering";

export type PanelSelection =
  | { t: "fixed"; id: VasteStapId }
  | { t: "optional"; stepId: string; kind: OptioneelStapKind };

function fc() {
  return "mt-1 w-full rounded-xl border border-border bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary";
}

function Label({ children }: { children: React.ReactNode }) {
  return <label className="block text-sm font-medium text-muted">{children}</label>;
}

export function StepSettingsPanel({
  selection,
  settings,
  onChangeFixed,
  onChangeOptionalFull,
  onClose,
}: {
  selection: PanelSelection;
  settings: Record<string, unknown>;
  onChangeFixed: (
    id: "trigger" | "ai_bellen" | "whatsapp",
    patch: Record<string, unknown>,
  ) => void;
  onChangeOptionalFull: (
    stepId: string,
    kind: OptioneelStapKind,
    value: Record<string, unknown>,
  ) => void;
  onClose: () => void;
}) {
  const [savedTick, setSavedTick] = useState(false);

  useEffect(() => {
    setSavedTick(false);
  }, [selection]);

  const trigger = { ...DEFAULT_TRIGGER, ...(settings.trigger as object) } as TriggerSettings;
  const ai = { ...DEFAULT_AI_BELLEN, ...(settings.ai_bellen as object) } as AiBellenSettings;
  const wa = { ...DEFAULT_WHATSAPP, ...(settings.whatsapp as object) } as WhatsAppBevestigingSettings;

  const title =
    selection.t === "fixed" ?
      selection.id === "trigger" ?
        { icon: "🎯", name: "Trigger" }
      : selection.id === "ai_bellen" ?
        { icon: "📞", name: "AI belt kandidaten" }
      : { icon: "💬", name: "WhatsApp bevestiging" }
    : {
        icon: LIBRARY_BLOCKS.find((b) => b.kind === selection.kind)?.emoji ?? "•",
        name: LIBRARY_BLOCKS.find((b) => b.kind === selection.kind)?.naam ?? "Stap",
      };

  let body: React.ReactNode = null;

  if (selection.t === "fixed" && selection.id === "trigger") {
    body = (
      <div className="space-y-4">
        <div>
          <Label>Trigger type</Label>
          <select
            className={fc()}
            value={trigger.triggerType}
            onChange={(e) =>
              onChangeFixed("trigger", {
                ...trigger,
                triggerType: e.target.value as TriggerSettings["triggerType"],
              })
            }
          >
            <option>Campagne handmatig gestart</option>
            <option>Nieuwe vacature aangemaakt</option>
            <option>Opdracht via WhatsApp</option>
          </select>
        </div>
        <div>
          <Label>Auto-start campagne</Label>
          <select
            className={fc()}
            value={trigger.autoStartCampagne}
            onChange={(e) =>
              onChangeFixed("trigger", {
                ...trigger,
                autoStartCampagne: e.target.value as TriggerSettings["autoStartCampagne"],
              })
            }
          >
            <option>Nee — wacht op goedkeuring</option>
            <option>Ja — direct starten</option>
          </select>
        </div>
      </div>
    );
  } else if (selection.t === "fixed" && selection.id === "ai_bellen") {
    body = (
      <div className="space-y-4">
        <div>
          <Label>Stem</Label>
          <select
            className={fc()}
            value={ai.stem}
            onChange={(e) =>
              onChangeFixed("ai_bellen", {
                ...ai,
                stem: e.target.value as AiBellenSettings["stem"],
              })
            }
          >
            <option>Nederlands vrouwelijk</option>
            <option>Nederlands mannelijk</option>
          </select>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>Beltijd van</Label>
            <input
              type="time"
              className={fc()}
              value={ai.beltijdVan}
              onChange={(e) => onChangeFixed("ai_bellen", { ...ai, beltijdVan: e.target.value })}
            />
          </div>
          <div>
            <Label>Beltijd tot</Label>
            <input
              type="time"
              className={fc()}
              value={ai.beltijdTot}
              onChange={(e) => onChangeFixed("ai_bellen", { ...ai, beltijdTot: e.target.value })}
            />
          </div>
        </div>
        <div>
          <Label>Max pogingen</Label>
          <select
            className={fc()}
            value={ai.maxPogingen}
            onChange={(e) =>
              onChangeFixed("ai_bellen", {
                ...ai,
                maxPogingen: Number(e.target.value) as AiBellenSettings["maxPogingen"],
              })
            }
          >
            {[1, 2, 3, 4, 5].map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </div>
        <div>
          <Label>Wachttijd tussen pogingen</Label>
          <select
            className={fc()}
            value={ai.wachttijdTussenPogingen}
            onChange={(e) =>
              onChangeFixed("ai_bellen", {
                ...ai,
                wachttijdTussenPogingen: e.target
                  .value as AiBellenSettings["wachttijdTussenPogingen"],
              })
            }
          >
            <option>30 minuten</option>
            <option>1 uur</option>
            <option>2 uur</option>
            <option>4 uur</option>
          </select>
        </div>
        <div>
          <Label>Max parallel bellen</Label>
          <select
            className={fc()}
            value={ai.maxParallel}
            onChange={(e) =>
              onChangeFixed("ai_bellen", {
                ...ai,
                maxParallel: Number(e.target.value) as AiBellenSettings["maxParallel"],
              })
            }
          >
            {[1, 2, 3, 5, 10].map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </div>
      </div>
    );
  } else if (selection.t === "fixed" && selection.id === "whatsapp") {
    body = (
      <div className="space-y-4">
        <div>
          <Label>Versturen na</Label>
          <select
            className={fc()}
            value={wa.versturenNa}
            onChange={(e) =>
              onChangeFixed("whatsapp", {
                ...wa,
                versturenNa: e.target.value as WhatsAppBevestigingSettings["versturenNa"],
              })
            }
          >
            <option>Direct na bevestiging</option>
            <option>1 uur na bevestiging</option>
            <option>Volgende ochtend 09:00</option>
          </select>
        </div>
        <div>
          <Label>Bevestiging vragen</Label>
          <select
            className={fc()}
            value={wa.bevestigingVragen}
            onChange={(e) =>
              onChangeFixed("whatsapp", {
                ...wa,
                bevestigingVragen: e.target.value as WhatsAppBevestigingSettings["bevestigingVragen"],
              })
            }
          >
            <option>Ja — kandidaat moet JA sturen</option>
            <option>Nee — alleen informeren</option>
          </select>
        </div>
      </div>
    );
  } else if (selection.t === "optional") {
    const oid = selection.stepId;
    const ok = selection.kind;
    const merged = (base: Record<string, unknown>) => ({
      ...base,
      ...((settings[oid] as object) ?? {}),
    });

    if (ok === "no_show") {
      const s = merged({ ...DEFAULT_NO_SHOW }) as NoShowSettings;
      body = (
        <div className="space-y-4">
          <div>
            <Label>Beltijd</Label>
            <input
              type="time"
              className={fc()}
              value={s.beltijd}
              onChange={(e) =>
                onChangeOptionalFull(oid, "no_show", { ...s, beltijd: e.target.value })
              }
            />
          </div>
          <div>
            <Label>Dagen voor startdatum</Label>
            <select
              className={fc()}
              value={s.dagenVoorStartdatum}
              onChange={(e) =>
                onChangeOptionalFull(oid, "no_show", {
                  ...s,
                  dagenVoorStartdatum: e.target.value as NoShowSettings["dagenVoorStartdatum"],
                })
              }
            >
              <option>1 dag</option>
              <option>2 dagen</option>
              <option>3 dagen</option>
            </select>
          </div>
          <div>
            <Label>Geen reactie na</Label>
            <select
              className={fc()}
              value={s.geenReactieNa}
              onChange={(e) =>
                onChangeOptionalFull(oid, "no_show", {
                  ...s,
                  geenReactieNa: e.target.value as NoShowSettings["geenReactieNa"],
                })
              }
            >
              <option>1 uur</option>
              <option>2 uur</option>
              <option>4 uur</option>
            </select>
          </div>
          <div>
            <Label>Dan</Label>
            <select
              className={fc()}
              value={s.dan}
              onChange={(e) =>
                onChangeOptionalFull(oid, "no_show", {
                  ...s,
                  dan: e.target.value as NoShowSettings["dan"],
                })
              }
            >
              <option>Email alert naar recruiter</option>
              <option>Automatisch vervanger zoeken</option>
            </select>
          </div>
        </div>
      );
    } else if (ok === "beschikbaarheid") {
      const s = merged({ ...DEFAULT_BESCHIKBAARHEID }) as BeschikbaarheidSettings;
      body = (
        <div className="space-y-4">
          <div>
            <Label>Dag</Label>
            <select
              className={fc()}
              value={s.dag}
              onChange={(e) =>
                onChangeOptionalFull(oid, "beschikbaarheid", {
                  ...s,
                  dag: e.target.value as BeschikbaarheidSettings["dag"],
                })
              }
            >
              <option>Maandag</option>
              <option>Dinsdag</option>
              <option>Vrijdag</option>
            </select>
          </div>
          <div>
            <Label>Tijdstip</Label>
            <input
              type="time"
              className={fc()}
              value={s.tijdstip}
              onChange={(e) =>
                onChangeOptionalFull(oid, "beschikbaarheid", { ...s, tijdstip: e.target.value })
              }
            />
          </div>
          <div>
            <Label>Sturen naar</Label>
            <select
              className={fc()}
              value={s.sturenNaar}
              onChange={(e) =>
                onChangeOptionalFull(oid, "beschikbaarheid", {
                  ...s,
                  sturenNaar: e.target.value as BeschikbaarheidSettings["sturenNaar"],
                })
              }
            >
              <option>Alleen actieve kandidaten</option>
              <option>Alle kandidaten</option>
            </select>
          </div>
        </div>
      );
    } else if (ok === "check_in") {
      const s = merged({ ...DEFAULT_CHECK_IN }) as CheckInSettings;
      body = (
        <div className="space-y-4">
          <div>
            <Label>Frequentie</Label>
            <select
              className={fc()}
              value={s.frequentie}
              onChange={(e) =>
                onChangeOptionalFull(oid, "check_in", {
                  ...s,
                  frequentie: e.target.value as CheckInSettings["frequentie"],
                })
              }
            >
              <option>Wekelijks</option>
              <option>Tweewekelijks</option>
              <option>Maandelijks</option>
            </select>
          </div>
          <div>
            <Label>Dag</Label>
            <select
              className={fc()}
              value={s.dag}
              onChange={(e) =>
                onChangeOptionalFull(oid, "check_in", {
                  ...s,
                  dag: e.target.value as CheckInSettings["dag"],
                })
              }
            >
              <option>Maandag</option>
              <option>Woensdag</option>
              <option>Vrijdag</option>
            </select>
          </div>
          <div>
            <Label>Bellen</Label>
            <select
              className={fc()}
              value={s.bellen}
              onChange={(e) =>
                onChangeOptionalFull(oid, "check_in", {
                  ...s,
                  bellen: e.target.value as CheckInSettings["bellen"],
                })
              }
            >
              <option>Alleen kandidaat</option>
              <option>Kandidaat + opdrachtgever</option>
            </select>
          </div>
        </div>
      );
    } else if (ok === "uren") {
      const s = merged({ ...DEFAULT_UREN }) as UrenSettings;
      body = (
        <div className="space-y-4">
          <div>
            <Label>Dag</Label>
            <select
              className={fc()}
              value={s.dag}
              onChange={(e) =>
                onChangeOptionalFull(oid, "uren", {
                  ...s,
                  dag: e.target.value as UrenSettings["dag"],
                })
              }
            >
              <option>Donderdag</option>
              <option>Vrijdag</option>
            </select>
          </div>
          <div>
            <Label>Tijdstip</Label>
            <input
              type="time"
              className={fc()}
              value={s.tijdstip}
              onChange={(e) =>
                onChangeOptionalFull(oid, "uren", { ...s, tijdstip: e.target.value })
              }
            />
          </div>
          <div>
            <Label>Via</Label>
            <select
              className={fc()}
              value={s.via}
              onChange={(e) =>
                onChangeOptionalFull(oid, "uren", {
                  ...s,
                  via: e.target.value as UrenSettings["via"],
                })
              }
            >
              <option>WhatsApp</option>
              <option>Email</option>
              <option>WhatsApp + Email</option>
            </select>
          </div>
        </div>
      );
    } else if (ok === "evaluatie") {
      const s = merged({ ...DEFAULT_EVALUATIE }) as EvaluatieSettings;
      body = (
        <div className="space-y-4">
          <div>
            <Label>Na einde plaatsing</Label>
            <select
              className={fc()}
              value={s.naEindePlaatsing}
              onChange={(e) =>
                onChangeOptionalFull(oid, "evaluatie", {
                  ...s,
                  naEindePlaatsing: e.target.value as EvaluatieSettings["naEindePlaatsing"],
                })
              }
            >
              <option>Direct</option>
              <option>Na 1 dag</option>
              <option>Na 3 dagen</option>
            </select>
          </div>
          <div>
            <Label>Bellen</Label>
            <select
              className={fc()}
              value={s.bellen}
              onChange={(e) =>
                onChangeOptionalFull(oid, "evaluatie", {
                  ...s,
                  bellen: e.target.value as EvaluatieSettings["bellen"],
                })
              }
            >
              <option>Alleen kandidaat</option>
              <option>Kandidaat + opdrachtgever</option>
            </select>
          </div>
        </div>
      );
    } else if (ok === "dagrapport") {
      const s = merged({ ...DEFAULT_DAGRAPPORT }) as DagrapportSettings;
      body = (
        <div className="space-y-4">
          <div>
            <Label>Tijdstip</Label>
            <input
              type="time"
              className={fc()}
              value={s.tijdstip}
              onChange={(e) =>
                onChangeOptionalFull(oid, "dagrapport", { ...s, tijdstip: e.target.value })
              }
            />
          </div>
          <div>
            <Label>Sturen naar</Label>
            <input
              type="email"
              className={fc()}
              placeholder="recruiter@bureau.nl"
              value={s.sturenNaarEmail}
              onChange={(e) =>
                onChangeOptionalFull(oid, "dagrapport", {
                  ...s,
                  sturenNaarEmail: e.target.value,
                })
              }
            />
          </div>
          <div>
            <Label>Alleen bij</Label>
            <select
              className={fc()}
              value={s.alleenBij}
              onChange={(e) =>
                onChangeOptionalFull(oid, "dagrapport", {
                  ...s,
                  alleenBij: e.target.value as DagrapportSettings["alleenBij"],
                })
              }
            >
              <option>Altijd sturen</option>
              <option>Alleen als er calls waren</option>
            </select>
          </div>
        </div>
      );
    } else if (ok === "ziekte") {
      const s = merged({ ...DEFAULT_ZIEKTE }) as ZiekteSettings;
      body = (
        <div className="space-y-4">
          <div>
            <Label>Reactietijd</Label>
            <select
              className={fc()}
              value={s.reactietijd}
              onChange={(e) =>
                onChangeOptionalFull(oid, "ziekte", {
                  ...s,
                  reactietijd: e.target.value as ZiekteSettings["reactietijd"],
                })
              }
            >
              <option>Direct</option>
              <option>Na 30 minuten</option>
              <option>Na 1 uur</option>
            </select>
          </div>
          <div>
            <Label>Alert sturen naar</Label>
            <input
              type="email"
              className={fc()}
              placeholder="recruiter@bureau.nl"
              value={s.alertEmail}
              onChange={(e) =>
                onChangeOptionalFull(oid, "ziekte", { ...s, alertEmail: e.target.value })
              }
            />
          </div>
        </div>
      );
    }
  }

  return (
    <div className="flex h-full flex-col border-l border-border bg-slate-50">
      <div className="flex items-start justify-between border-b border-border p-4">
        <div className="flex items-center gap-2">
          <span className="text-2xl" aria-hidden>
            {title.icon}
          </span>
          <h2 className="font-serif text-lg text-slate-900">{title.name}</h2>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg p-1 text-muted hover:bg-white hover:text-slate-900"
          aria-label="Sluiten"
        >
          <X className="h-5 w-5" />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-4">{body}</div>
      <div className="border-t border-border p-4">
        <button
          type="button"
          onClick={() => {
            setSavedTick(true);
            window.setTimeout(() => setSavedTick(false), 1500);
          }}
          className="w-full rounded-xl bg-primary py-2 text-sm font-medium text-white"
        >
          {savedTick ? "Opgeslagen ✓" : "Instellingen bewaren"}
        </button>
      </div>
    </div>
  );
}
