"use client";

import { Modal } from "@/components/ui/Modal";
import type { Gesprek, Kandidaat } from "@/lib/types";
import { cn } from "@/lib/utils";

export function GesprekRapportModal({
  open,
  onClose,
  kandidaat,
  gesprek,
  onStatus,
}: {
  open: boolean;
  onClose: () => void;
  kandidaat: Kandidaat | null;
  gesprek: Gesprek | null;
  onStatus?: (s: "geschikt" | "niet_geschikt") => void;
}) {
  if (!gesprek || !kandidaat) return null;

  const aan = gesprek.aanbeveling ?? "";
  const color =
    aan === "GESCHIKT" ? "bg-green-50 text-success"
    : aan === "TWIJFEL" ? "bg-amber-50 text-warning"
    : "bg-red-50 text-danger";

  const antwoorden = gesprek.antwoorden ?? {};

  return (
    <Modal open={open} onClose={onClose} title={kandidaat.naam} className="max-w-2xl">
      <div className={cn("mb-4 rounded-xl px-4 py-3 text-center text-lg font-semibold", color)}>
        {aan.replace("_", " ")}
      </div>
      <p className="text-sm text-muted">
        Score: <strong>{gesprek.score ?? "—"}/10</strong>
      </p>
      <section className="mt-4">
        <h3 className="text-sm font-semibold text-slate-800">Antwoorden</h3>
        <div className="mt-2 space-y-2">
          {Object.entries(antwoorden).map(([k, v]) => (
            <div key={k} className="rounded-xl border border-border bg-slate-50 p-3 text-sm">
              <p className="text-muted">{k}</p>
              <p className="text-slate-900">{v}</p>
            </div>
          ))}
        </div>
      </section>
      {gesprek.samenvatting && (
        <section className="mt-4">
          <h3 className="text-sm font-semibold">Samenvatting</h3>
          <p className="mt-1 text-sm text-slate-700">{gesprek.samenvatting}</p>
        </section>
      )}
      <section className="mt-4 grid gap-4 sm:grid-cols-2">
        <div>
          <h4 className="text-xs font-medium text-success">Positief</h4>
          <ul className="mt-1 list-inside list-disc text-sm">
            {(gesprek.positieve_punten ?? []).map((p, i) => (
              <li key={i}>{p}</li>
            ))}
          </ul>
        </div>
        <div>
          <h4 className="text-xs font-medium text-danger">Negatief</h4>
          <ul className="mt-1 list-inside list-disc text-sm">
            {(gesprek.negatieve_punten ?? []).map((p, i) => (
              <li key={i}>{p}</li>
            ))}
          </ul>
        </div>
      </section>
      {gesprek.transcript && (
        <details className="mt-4">
          <summary className="cursor-pointer text-sm text-primary">Transcript</summary>
          <pre className="mt-2 max-h-48 overflow-auto rounded-lg bg-slate-50 p-2 font-mono text-xs">
            {gesprek.transcript}
          </pre>
        </details>
      )}
      <div className="mt-6 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => onStatus?.("geschikt")}
          className="rounded-xl bg-success px-3 py-2 text-sm text-white"
        >
          Bevestig als geschikt
        </button>
        <button
          type="button"
          onClick={() => onStatus?.("niet_geschikt")}
          className="rounded-xl bg-danger px-3 py-2 text-sm text-white"
        >
          Markeer als niet geschikt
        </button>
        <button
          type="button"
          className="rounded-xl bg-primary px-3 py-2 text-sm text-white"
        >
          Plan interview
        </button>
      </div>
    </Modal>
  );
}
