"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { createClient } from "@/lib/supabase/client";
import { CAMPAGNE_TYPES, DEFAULT_SCREENING_VRAGEN } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { ScreeningVragenEditor } from "./ScreeningVragen";

type KRow = { id: string; naam: string; telefoon: string };

/** Leest fouttekst uit API-response; faalt niet op lege of niet-JSON body. */
async function parseApiError(res: Response): Promise<string> {
  const text = await res.text();
  const trimmed = text.trim();
  if (!trimmed) {
    return `Start mislukt (HTTP ${res.status})`;
  }
  try {
    const j = JSON.parse(trimmed) as { error?: string };
    return j.error ?? trimmed.slice(0, 300);
  } catch {
    return trimmed.slice(0, 300) || `Start mislukt (HTTP ${res.status})`;
  }
}

export function CampagneWizard({
  bureauId,
  vacatures,
  kandidaten,
}: {
  bureauId: string;
  vacatures: { id: string; titel: string }[];
  kandidaten: KRow[];
}) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [naam, setNaam] = useState("");
  const [type, setType] = useState("prescreening");
  const [vacatureId, setVacatureId] = useState("");
  const [rapportEmail, setRapportEmail] = useState("");
  const [script, setScript] = useState("");
  const [vragen, setVragen] = useState<string[]>(DEFAULT_SCREENING_VRAGEN);
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [csvNote, setCsvNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const defaultScript = useMemo(() => {
    const t = CAMPAGNE_TYPES.find((x) => x.id === type);
    return `Standaard ${t?.label ?? "campagne"} — pas aan naar uw bureau.`;
  }, [type]);

  const selectedIds = Object.keys(selected).filter((k) => selected[k]);
  const totaal = selectedIds.length;

  function toggle(id: string) {
    setSelected((s) => ({ ...s, [id]: !s[id] }));
  }

  async function saveConcept() {
    await submit("concept");
  }

  async function startNow() {
    await submit("actief");
  }

  async function submit(status: "concept" | "actief") {
    setLoading(true);
    setError(null);
    const supabase = createClient();
    const screening_vragen = vragen;
    const { data: campagne, error: cErr } = await supabase
      .from("campagnes")
      .insert({
        bureau_id: bureauId,
        naam,
        type,
        vacature_id: vacatureId || null,
        rapport_email: rapportEmail || null,
        script: script || defaultScript,
        screening_vragen,
        status,
        totaal_kandidaten: totaal,
      })
      .select("id")
      .single();

    if (cErr || !campagne) {
      setLoading(false);
      setError(cErr?.message ?? "Opslaan mislukt");
      return;
    }

    for (const kid of selectedIds) {
      await supabase.from("campagne_kandidaten").insert({
        campagne_id: campagne.id,
        kandidaat_id: kid,
        status: "wacht",
      });
    }

    if (status === "actief") {
      const res = await fetch(`/api/campagnes/${campagne.id}/start`, {
        method: "POST",
      });
      if (!res.ok) {
        const errMsg = await parseApiError(res);
        setError(errMsg);
        setLoading(false);
        return;
      }
      toast.success("Campagne gestart! AI belt kandidaten op.");
    }

    setLoading(false);
    router.push(`/campagnes/${campagne.id}`);
    router.refresh();
  }

  const geschatMin = totaal * 6;
  const creditsNodig = totaal;

  return (
    <div className="max-w-3xl space-y-8">
      <div className="flex w-full max-w-xl items-center">
        {[1, 2, 3, 4].map((s, idx) => (
          <div key={s} className="flex flex-1 items-center">
            <div
              className={cn(
                "flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-xs font-medium",
                step === s &&
                  "border-transparent bg-[color:var(--cream-text)] text-[color:var(--cream-bg)]",
                step > s &&
                  "border-transparent bg-[color:var(--cream-green)] text-[color:var(--cream-green-text)]",
                step < s &&
                  "border border-[color:var(--cream-border-md)] bg-transparent text-[color:var(--cream-faint)]",
              )}
            >
              {s}
            </div>
            {idx < 3 && (
              <div className="mx-1 h-px min-w-[4px] flex-1 bg-[color:var(--cream-border)]" />
            )}
          </div>
        ))}
      </div>
      <p className="text-xs text-[color:var(--cream-muted)]">
        Stap {step} van 4
      </p>

      {step === 1 && (
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-[color:var(--cream-text)]">
              Campagnenaam *
            </label>
            <input
              value={naam}
              onChange={(e) => setNaam(e.target.value)}
              className="input-cream mt-1"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-[color:var(--cream-text)]">
              Type
            </label>
            <div className="mt-2 grid gap-2 sm:grid-cols-2">
              {CAMPAGNE_TYPES.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setType(t.id)}
                  className={cn(
                    "rounded-[7px] border px-3 py-2 text-left text-sm transition-colors",
                    type === t.id ?
                      "border-[color:var(--cream-border-str)] bg-[color:var(--cream-surface)] text-[color:var(--cream-text)]"
                    : "border-[color:var(--cream-border-md)] bg-transparent text-[color:var(--cream-text)] hover:bg-[color:var(--cream-surface)]",
                  )}
                >
                  <span className="mr-2">{t.emoji}</span>
                  {t.label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-sm font-medium text-[color:var(--cream-text)]">
              Vacature (optioneel)
            </label>
            <select
              value={vacatureId}
              onChange={(e) => setVacatureId(e.target.value)}
              className="input-cream mt-1"
            >
              <option value="">—</option>
              {vacatures.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.titel}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-sm font-medium text-[color:var(--cream-text)]">
              Rapport e-mail
            </label>
            <input
              type="email"
              value={rapportEmail}
              onChange={(e) => setRapportEmail(e.target.value)}
              className="input-cream mt-1"
            />
          </div>
          <button
            type="button"
            onClick={() => setStep(2)}
            className="btn-cream-primary"
          >
            Volgende
          </button>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-[color:var(--cream-text)]">
              Script / prompt
            </label>
            <textarea
              value={script || defaultScript}
              onChange={(e) => setScript(e.target.value)}
              rows={6}
              className="input-cream mt-1 font-mono text-sm"
            />
          </div>
          <ScreeningVragenEditor value={vragen} onChange={setVragen} />
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="btn-cream-secondary"
            >
              Terug
            </button>
            <button
              type="button"
              onClick={() => setStep(3)}
              className="btn-cream-primary"
            >
              Volgende
            </button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-4">
          <p className="text-sm text-[color:var(--cream-muted)]">
            Selecteer kandidaten uit uw database (CSV-upload: plak later of
            gebruik import bij kandidaten).
          </p>
          <div className="max-h-64 overflow-y-auto rounded-[10px] border border-[color:var(--cream-border)] bg-[color:var(--cream-bg)]">
            {kandidaten.map((k) => (
              <label
                key={k.id}
                className="flex cursor-pointer items-center gap-2 border-b border-[color:var(--cream-border)] px-3 py-2 text-sm last:border-0 hover:bg-[color:var(--cream-surface)]"
              >
                <input
                  type="checkbox"
                  checked={!!selected[k.id]}
                  onChange={() => toggle(k.id)}
                />
                <span>{k.naam}</span>
                <span className="text-[color:var(--cream-muted)]">
                  {k.telefoon}
                </span>
              </label>
            ))}
          </div>
          <textarea
            value={csvNote}
            onChange={(e) => setCsvNote(e.target.value)}
            placeholder="CSV preview notities (optioneel)"
            rows={2}
            className="input-cream border-dashed text-sm text-[color:var(--cream-muted)]"
            readOnly
          />
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setStep(2)}
              className="btn-cream-secondary"
            >
              Terug
            </button>
            <button
              type="button"
              onClick={() => setStep(4)}
              disabled={!totaal}
              className="btn-cream-primary disabled:opacity-50"
            >
              Volgende
            </button>
          </div>
        </div>
      )}

      {step === 4 && (
        <div className="panel-cream space-y-4 p-6 shadow-none">
          <h3 className="text-lg font-medium text-[color:var(--cream-text)]">
            Samenvatting
          </h3>
          <ul className="space-y-1 text-sm text-[color:var(--cream-text)]">
            <li>
              <strong>Type:</strong> {type}
            </li>
            <li>
              <strong>Vacature:</strong>{" "}
              {vacatures.find((v) => v.id === vacatureId)?.titel ?? "—"}
            </li>
            <li>
              <strong>Kandidaten:</strong> {totaal}
            </li>
            <li>
              <strong>Geschatte duur:</strong> ca. {geschatMin} min
            </li>
            <li>
              <strong>Credits nodig:</strong> {creditsNodig}
            </li>
            <li>
              <strong>Rapport naar:</strong> {rapportEmail || "—"}
            </li>
          </ul>
          {error && (
            <p className="text-sm text-[color:var(--cream-red-text)]">{error}</p>
          )}
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setStep(3)}
              className="btn-cream-secondary"
            >
              Terug
            </button>
            <button
              type="button"
              onClick={saveConcept}
              disabled={loading || !naam}
              className="btn-cream-secondary font-medium disabled:opacity-50"
            >
              {loading ? "Bezig…" : "Opslaan als concept"}
            </button>
            <button
              type="button"
              onClick={startNow}
              disabled={loading || !naam || !totaal}
              className="btn-cream-primary font-medium disabled:opacity-50"
            >
              {loading ? "Bezig…" : "Start screening nu"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
