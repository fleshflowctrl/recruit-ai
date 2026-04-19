"use client";

import { useEffect, useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { ScoreBadge } from "@/components/ui/ScoreBadge";
import { StatusBadge } from "@/components/ui/StatusBadge";
import type { Gesprek, Kandidaat, PlaatsingPrefill } from "@/lib/types";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";

export function GesprekRapportModal({
  open,
  onClose,
  kandidaat,
  gesprek,
  campagneId,
  campagneKandidaatId,
  plaatsingPrefill,
  onUpdated,
}: {
  open: boolean;
  onClose: () => void;
  kandidaat: Kandidaat | null;
  gesprek: Gesprek | null;
  campagneId: string;
  campagneKandidaatId: string;
  plaatsingPrefill: PlaatsingPrefill | null;
  onUpdated?: () => void;
}) {
  const g = gesprek;
  const k = kandidaat;
  const [step, setStep] = useState<"rapport" | "plaatsing">("rapport");
  const [plaatsingBusy, setPlaatsingBusy] = useState(false);
  const [startdatum, setStartdatum] = useState("");
  const [starttijd, setStarttijd] = useState("08:00");
  const [adres, setAdres] = useState("");
  const [contactpersoon, setContactpersoon] = useState("");
  const [contactTelefoon, setContactTelefoon] = useState("");
  const [meeNemen, setMeeNemen] = useState("");

  useEffect(() => {
    if (open) {
      setStep("rapport");
      setPlaatsingBusy(false);
    }
  }, [open]);

  if (!g || !k) return null;

  const aan = g.aanbeveling ?? "";
  const color =
    aan === "GESCHIKT"
      ? "bg-green-50 text-success"
      : aan === "TWIJFEL"
        ? "bg-amber-50 text-warning"
        : "bg-red-50 text-danger";

  const antwoorden = g.antwoorden ?? {};

  function openPlaatsingStap() {
    if (!plaatsingPrefill) {
      toast.error(
        "Geen vacature gekoppeld aan deze campagne. Koppel eerst een vacature.",
      );
      return;
    }
    setStartdatum(plaatsingPrefill.startdatumDefault);
    setStarttijd("08:00");
    setAdres(plaatsingPrefill.adres);
    setContactpersoon(plaatsingPrefill.contactpersoon);
    setContactTelefoon(plaatsingPrefill.contactTelefoon);
    setMeeNemen("");
    setStep("plaatsing");
  }

  async function bevestigPlaatsing() {
    if (!plaatsingPrefill || !k) return;
    setPlaatsingBusy(true);
    const t = toast.loading("Plaatsing aanmaken…");
    try {
      const res = await fetch("/api/plaatsingen", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kandidaatId: k.id,
          vacatureId: plaatsingPrefill.vacatureId,
          opdrachtgeverId: plaatsingPrefill.opdrachtgeverId,
          startdatum,
          einddatum: plaatsingPrefill.einddatum,
          starttijd,
          adres,
          contactpersoon,
          contactTelefoon,
          meeNemen: meeNemen.trim() || undefined,
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
    } finally {
      setPlaatsingBusy(false);
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
      title={
        step === "rapport"
          ? `Gesprekrapport — ${k.naam}`
          : `Plaatsing bevestigen — ${k.naam}`
      }
      className="max-w-2xl"
    >
      {step === "plaatsing" && plaatsingPrefill ? (
        <div className="space-y-4">
          <p className="text-sm text-muted">
            {plaatsingPrefill.functieTitel} bij {plaatsingPrefill.bedrijfNaam}
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="text-sm">
              <span className="font-medium text-slate-800">Startdatum</span>
              <input
                type="date"
                value={startdatum}
                onChange={(e) => setStartdatum(e.target.value)}
                className="mt-1 w-full rounded-xl border border-border px-3 py-2 text-sm"
              />
            </label>
            <label className="text-sm">
              <span className="font-medium text-slate-800">Starttijd</span>
              <input
                type="time"
                value={starttijd}
                onChange={(e) => setStarttijd(e.target.value)}
                className="mt-1 w-full rounded-xl border border-border px-3 py-2 text-sm"
              />
            </label>
          </div>
          <label className="block text-sm">
            <span className="font-medium text-slate-800">Adres</span>
            <input
              value={adres}
              onChange={(e) => setAdres(e.target.value)}
              className="mt-1 w-full rounded-xl border border-border px-3 py-2 text-sm"
            />
          </label>
          <label className="block text-sm">
            <span className="font-medium text-slate-800">Contactpersoon</span>
            <input
              value={contactpersoon}
              onChange={(e) => setContactpersoon(e.target.value)}
              className="mt-1 w-full rounded-xl border border-border px-3 py-2 text-sm"
            />
          </label>
          <label className="block text-sm">
            <span className="font-medium text-slate-800">Telefoon contact</span>
            <input
              value={contactTelefoon}
              onChange={(e) => setContactTelefoon(e.target.value)}
              className="mt-1 w-full rounded-xl border border-border px-3 py-2 text-sm"
            />
          </label>
          <label className="block text-sm">
            <span className="font-medium text-slate-800">Wat meenemen (optioneel)</span>
            <input
              value={meeNemen}
              onChange={(e) => setMeeNemen(e.target.value)}
              placeholder="Bijv. ID-kaart, werkschoenen…"
              className="mt-1 w-full rounded-xl border border-border px-3 py-2 text-sm"
            />
          </label>
          <div className="flex flex-wrap gap-2 border-t border-border pt-4">
            <button
              type="button"
              disabled={plaatsingBusy}
              onClick={() => setStep("rapport")}
              className="rounded-xl border border-border px-4 py-2 text-sm font-medium hover:bg-slate-50 disabled:opacity-50"
            >
              Terug
            </button>
            <button
              type="button"
              disabled={plaatsingBusy || !startdatum.trim()}
              onClick={bevestigPlaatsing}
              className="rounded-xl bg-success px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
            >
              {plaatsingBusy ? "Bezig…" : "Bevestigen"}
            </button>
          </div>
        </div>
      ) : (
        <>
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
              onClick={openPlaatsingStap}
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
        </>
      )}
    </Modal>
  );
}
