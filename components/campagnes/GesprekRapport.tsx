"use client";

import { Modal } from "@/components/ui/Modal";
import { ScoreBadge } from "@/components/ui/ScoreBadge";
import { StatusBadge } from "@/components/ui/StatusBadge";
import type { Gesprek, Kandidaat } from "@/lib/types";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";

export function GesprekRapportModal({
  open,
  onClose,
  kandidaat,
  gesprek,
  campagneId,
  campagneKandidaatId,
  onUpdated,
}: {
  open: boolean;
  onClose: () => void;
  kandidaat: Kandidaat | null;
  gesprek: Gesprek | null;
  campagneId: string;
  campagneKandidaatId: string;
  onUpdated?: () => void;
}) {
  const g = gesprek;
  const k = kandidaat;
  if (!g || !k) return null;

  const gesprekId = g.id;

  const aan = g.aanbeveling ?? "";
  const color =
    aan === "GESCHIKT"
      ? "bg-green-50 text-success"
      : aan === "TWIJFEL"
        ? "bg-amber-50 text-warning"
        : "bg-red-50 text-danger";

  const antwoorden = g.antwoorden ?? {};

  async function bevestigPlaatsing() {
    const t = toast.loading("Plaatsing aanmaken…");
    try {
      const res = await fetch("/api/plaatsingen/from-rapport", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          gesprekId,
          campagneId,
        }),
      });
      const j = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(j.error ?? "Mislukt");
      toast.success("Plaatsing bevestigd en WhatsApp verzonden ✅", { id: t });
      onUpdated?.();
      onClose();
    } catch (e) {
      toast.error(
        e instanceof Error ? e.message : "Plaatsing kon niet worden opgeslagen",
        { id: t },
      );
    }
  }

  async function nietGeschikt() {
    const t = toast.loading("Status bijwerken…");
    try {
      const res = await fetch(`/api/campagne-kandidaten/${campagneKandidaatId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "niet_geschikt" }),
      });
      const j = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(j.error ?? "Mislukt");
      toast.success("Kandidaat gemarkeerd als niet geschikt", { id: t });
      onUpdated?.();
      onClose();
    } catch (e) {
      toast.error(
        e instanceof Error ? e.message : "Status bijwerken mislukt",
        { id: t },
      );
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Gesprekrapport — ${k.naam}`}
      className="max-w-2xl"
    >
      <div className="flex flex-wrap items-center gap-3">
        <ScoreBadge score={g.score} />
        <span className="text-sm text-muted">Score</span>
        <StatusBadge status={g.aanbeveling} />
        <span className="text-sm text-muted">Aanbeveling</span>
      </div>

      <div
        className={cn(
          "mt-4 rounded-xl px-4 py-3 text-center text-lg font-semibold",
          color,
        )}
      >
        {(g.aanbeveling ?? "—").replaceAll("_", " ")}
      </div>

      {g.samenvatting && (
        <section className="mt-4">
          <h3 className="text-sm font-semibold text-slate-800">Samenvatting</h3>
          <p className="mt-1 text-sm text-slate-700">{g.samenvatting}</p>
        </section>
      )}

      <section className="mt-4">
        <h3 className="text-sm font-semibold text-slate-800">Antwoorden</h3>
        <div className="mt-2 space-y-2">
          {Object.keys(antwoorden).length === 0 && (
            <p className="text-sm text-muted">Geen Q&amp;A vastgelegd.</p>
          )}
          {Object.entries(antwoorden).map(([qk, v]) => (
            <div
              key={qk}
              className="rounded-xl border border-border bg-slate-50 p-3 text-sm"
            >
              <p className="text-muted">{qk}</p>
              <p className="text-slate-900">{String(v)}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-4 grid gap-4 sm:grid-cols-2">
        <div>
          <h4 className="text-xs font-medium text-success">Positieve punten</h4>
          <ul className="mt-1 list-inside list-disc text-sm text-green-800">
            {(g.positieve_punten ?? []).length === 0 && (
              <li className="list-none text-muted">—</li>
            )}
            {(g.positieve_punten ?? []).map((p, i) => (
              <li key={i}>{p}</li>
            ))}
          </ul>
        </div>
        <div>
          <h4 className="text-xs font-medium text-danger">Negatieve punten</h4>
          <ul className="mt-1 list-inside list-disc text-sm text-red-800">
            {(g.negatieve_punten ?? []).length === 0 && (
              <li className="list-none text-muted">—</li>
            )}
            {(g.negatieve_punten ?? []).map((p, i) => (
              <li key={i}>{p}</li>
            ))}
          </ul>
        </div>
      </section>

      {g.transcript && (
        <details className="mt-4 rounded-xl border border-border bg-slate-50/80">
          <summary className="cursor-pointer px-3 py-2 text-sm font-medium text-primary">
            Transcript tonen
          </summary>
          <pre className="max-h-48 overflow-auto border-t border-border p-3 font-mono text-xs text-slate-800">
            {g.transcript}
          </pre>
        </details>
      )}

      <div className="mt-6 flex flex-wrap gap-2 border-t border-border pt-4">
        <button
          type="button"
          onClick={bevestigPlaatsing}
          className="rounded-xl bg-success px-4 py-2 text-sm font-medium text-white hover:opacity-90"
        >
          Bevestig plaatsing
        </button>
        <button
          type="button"
          onClick={nietGeschikt}
          className="rounded-xl bg-danger px-4 py-2 text-sm font-medium text-white hover:opacity-90"
        >
          Niet geschikt
        </button>
      </div>
    </Modal>
  );
}
