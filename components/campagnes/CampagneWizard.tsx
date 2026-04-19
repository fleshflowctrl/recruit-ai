"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { createClient } from "@/lib/supabase/client";
import { CAMPAGNE_TYPES, DEFAULT_SCREENING_VRAGEN } from "@/lib/constants";
import { ScreeningVragenEditor } from "./ScreeningVragen";

type KRow = { id: string; naam: string; telefoon: string };

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
        const j = await res.json();
        setError(j.error ?? "Start mislukt");
        setLoading(false);
        return;
      }
      toast.success("Campagne gestart ✅");
    }

    setLoading(false);
    router.push(`/campagnes/${campagne.id}`);
    router.refresh();
  }

  const geschatMin = totaal * 6;
  const creditsNodig = totaal;

  return (
    <div className="max-w-3xl space-y-8">
      <div className="flex gap-2 text-sm">
        {[1, 2, 3, 4].map((s) => (
          <span
            key={s}
            className={
              step === s ?
                "font-semibold text-primary"
              : "text-muted"
            }
          >
            Stap {s}
          </span>
        ))}
      </div>

      {step === 1 && (
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium">Campagnenaam *</label>
            <input
              value={naam}
              onChange={(e) => setNaam(e.target.value)}
              className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2"
            />
          </div>
          <div>
            <label className="text-sm font-medium">Type</label>
            <div className="mt-2 grid gap-2 sm:grid-cols-2">
              {CAMPAGNE_TYPES.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setType(t.id)}
                  className={`rounded-xl border px-3 py-2 text-left text-sm ${
                    type === t.id ?
                      "border-primary bg-blue-50"
                    : "border-border hover:bg-slate-50"
                  }`}
                >
                  <span className="mr-2">{t.emoji}</span>
                  {t.label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-sm font-medium">Vacature (optioneel)</label>
            <select
              value={vacatureId}
              onChange={(e) => setVacatureId(e.target.value)}
              className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2"
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
            <label className="text-sm font-medium">Rapport e-mail</label>
            <input
              type="email"
              value={rapportEmail}
              onChange={(e) => setRapportEmail(e.target.value)}
              className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2"
            />
          </div>
          <button
            type="button"
            onClick={() => setStep(2)}
            className="rounded-xl bg-primary px-4 py-2 text-sm text-white"
          >
            Volgende
          </button>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium">Script / prompt</label>
            <textarea
              value={script || defaultScript}
              onChange={(e) => setScript(e.target.value)}
              rows={6}
              className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 font-mono text-sm"
            />
          </div>
          <ScreeningVragenEditor value={vragen} onChange={setVragen} />
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="rounded-xl border border-border px-4 py-2 text-sm"
            >
              Terug
            </button>
            <button
              type="button"
              onClick={() => setStep(3)}
              className="rounded-xl bg-primary px-4 py-2 text-sm text-white"
            >
              Volgende
            </button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-4">
          <p className="text-sm text-muted">
            Selecteer kandidaten uit uw database (CSV-upload: plak later of gebruik import bij kandidaten).
          </p>
          <div className="max-h-64 overflow-y-auto rounded-xl border border-border">
            {kandidaten.map((k) => (
              <label
                key={k.id}
                className="flex cursor-pointer items-center gap-2 border-b border-border px-3 py-2 text-sm last:border-0 hover:bg-slate-50"
              >
                <input
                  type="checkbox"
                  checked={!!selected[k.id]}
                  onChange={() => toggle(k.id)}
                />
                <span>{k.naam}</span>
                <span className="text-muted">{k.telefoon}</span>
              </label>
            ))}
          </div>
          <textarea
            value={csvNote}
            onChange={(e) => setCsvNote(e.target.value)}
            placeholder="CSV preview notities (optioneel)"
            rows={2}
            className="w-full rounded-xl border border-dashed border-border px-3 py-2 text-sm text-muted"
            readOnly
          />
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setStep(2)}
              className="rounded-xl border border-border px-4 py-2 text-sm"
            >
              Terug
            </button>
            <button
              type="button"
              onClick={() => setStep(4)}
              disabled={!totaal}
              className="rounded-xl bg-primary px-4 py-2 text-sm text-white disabled:opacity-50"
            >
              Volgende
            </button>
          </div>
        </div>
      )}

      {step === 4 && (
        <div className="space-y-4 rounded-2xl border border-border bg-slate-50 p-6">
          <h3 className="font-serif text-lg">Samenvatting</h3>
          <ul className="space-y-1 text-sm">
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
          {error && <p className="text-sm text-danger">{error}</p>}
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setStep(3)}
              className="rounded-xl border border-border px-4 py-2 text-sm"
            >
              Terug
            </button>
            <button
              type="button"
              onClick={saveConcept}
              disabled={loading || !naam}
              className="rounded-xl border border-border bg-white px-4 py-2 text-sm font-medium"
            >
              {loading ? "Bezig…" : "Opslaan als concept"}
            </button>
            <button
              type="button"
              onClick={startNow}
              disabled={loading || !naam || !totaal}
              className="rounded-xl bg-primary px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
            >
              {loading ? "Bezig…" : "Start screening nu"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
