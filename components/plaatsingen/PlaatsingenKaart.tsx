"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import toast from "react-hot-toast";
import { formatDateNl } from "@/lib/utils";

export type PlaatsingRow = {
  id: string;
  kandidaatNaam: string;
  kandidaatId: string;
  opdrachtgeverNaam: string;
  vacatureTitel: string;
  startdatum: string | null;
  einddatum: string | null;
  status: string;
  uurtariefKandidaat: string | null;
  uurtariefOpdrachtgever: string | null;
};

function getInitials(naam: string): string {
  const parts = naam.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0]!.slice(0, 1).toUpperCase();
  const first = parts[0]!.slice(0, 1);
  const last = parts[parts.length - 1]!.slice(0, 1);
  return (first + last).toUpperCase();
}

type BadgeTone = "actief" | "bevestigd" | "beeindigd" | "default";

function statusTone(status: string): BadgeTone {
  if (status === "actief") return "actief";
  if (status === "bevestigd" || status === "bevestigd_door_kandidaat")
    return "bevestigd";
  if (status === "beëindigd") return "beeindigd";
  return "default";
}

function avatarBg(status: string): string {
  const t = statusTone(status);
  switch (t) {
    case "actief":
      return "#5C8A5C";
    case "bevestigd":
      return "#4A7AB4";
    case "beeindigd":
      return "#B0AFA9";
    default:
      return "#8A8A85";
  }
}

function StatusBadgeInner({ status }: { status: string }) {
  const t = statusTone(status);
  const label =
    status === "bevestigd_door_kandidaat"
      ? "Bevestigd"
      : status === "bevestigd"
        ? "Bevestigd"
        : status === "actief"
          ? "Actief"
          : status === "beëindigd"
            ? "Beëindigd"
            : status;

  const styles: Record<
    BadgeTone,
    { bg: string; color: string; dot: string; pulse?: boolean }
  > = {
    actief: { bg: "#D4EDD8", color: "#1A5C2A", dot: "#5C8A5C", pulse: true },
    bevestigd: { bg: "#D4E4F7", color: "#1D4A7A", dot: "#4A7AB4" },
    beeindigd: { bg: "#EFEDE8", color: "#8A8A85", dot: "#B0AFA9" },
    default: { bg: "#EFEDE8", color: "#8A8A85", dot: "#8A8A85" },
  };

  const s = styles[t];

  return (
    <span
      className="inline-flex items-center gap-1 rounded-[20px] px-[10px] py-1 text-[11px] font-medium"
      style={{ background: s.bg, color: s.color }}
    >
      <span
        className="inline-block h-[5px] w-[5px] flex-shrink-0 rounded-full"
        style={{
          background: s.dot,
          animation: s.pulse
            ? "plaatsingPulse 1.4s ease-in-out infinite"
            : undefined,
        }}
      />
      {label}
    </span>
  );
}

export function PlaatsingenKaart(
  props: PlaatsingRow & { bureauId: string }
) {
  const {
    id,
    kandidaatNaam,
    kandidaatId,
    opdrachtgeverNaam,
    vacatureTitel,
    startdatum,
    einddatum,
    status,
    uurtariefKandidaat,
    uurtariefOpdrachtgever,
  } = props;

  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);

  async function beeindig(idParam: string) {
    if (!confirm("Plaatsing beëindigen?")) return;
    setBusy(idParam);
    const t = toast.loading("Bezig…");
    try {
      const res = await fetch(`/api/plaatsingen/${idParam}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "beëindigd" }),
      });
      const j = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(j.error ?? "Mislukt");
      toast.success("Plaatsing beëindigd", { id: t });
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Fout", { id: t });
    } finally {
      setBusy(null);
    }
  }

  const marge =
    uurtariefOpdrachtgever && uurtariefKandidaat
      ? (
          parseFloat(uurtariefOpdrachtgever) -
          parseFloat(uurtariefKandidaat)
        ).toFixed(2)
      : null;

  const now = new Date();
  const start = startdatum ? new Date(startdatum) : null;
  const end = einddatum ? new Date(einddatum) : null;

  let pct = 0;
  if (start && end && end.getTime() > start.getTime() && now > start) {
    pct = Math.min(
      100,
      Math.round(
        ((now.getTime() - start.getTime()) /
          (end.getTime() - start.getTime())) *
          100
      )
    );
  }

  const pctLabel =
    pct === 0 && start && start.getTime() > now.getTime()
      ? "start binnenkort"
      : `${pct}%`;

  return (
    <>
      <style>{`
        @keyframes plaatsingPulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
      `}</style>
      <div
        className="overflow-hidden rounded-[12px] border border-[rgba(0,0,0,0.07)] bg-white transition-all duration-150 hover:border-[rgba(0,0,0,0.14)] hover:shadow-[0_4px_16px_rgba(0,0,0,0.05)]"
      >
        <div className="grid grid-cols-[auto_minmax(0,1fr)] items-start gap-4 px-5 py-[18px] md:grid-cols-[auto_minmax(0,1fr)_auto] md:items-center md:gap-4">
          <div
            className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full text-[14px] font-bold text-[#FAFAF8]"
            style={{ background: avatarBg(status) }}
          >
            {getInitials(kandidaatNaam)}
          </div>

          <div className="min-w-0">
            <div className="mb-1 flex flex-wrap items-center gap-2">
              {kandidaatId ? (
                <Link
                  href={`/kandidaten/${kandidaatId}`}
                  className="text-[15px] font-semibold text-[#1A1A18] hover:underline"
                >
                  {kandidaatNaam}
                </Link>
              ) : (
                <span className="text-[15px] font-semibold text-[#1A1A18]">
                  {kandidaatNaam}
                </span>
              )}
              <StatusBadgeInner status={status} />
            </div>
            <div className="flex flex-wrap gap-[10px] text-[12px]">
              <span>
                💼{" "}
                <span className="font-medium text-[#1A1A18]">
                  {vacatureTitel}
                </span>
              </span>
              <span className="text-[#8A8A85]">🏢 {opdrachtgeverNaam}</span>
            </div>
          </div>

          <div
            className="col-span-2 flex w-full flex-shrink-0 flex-col items-end gap-1.5 md:col-span-1 md:w-auto"
          >
            {marge != null && (
              <>
                <p
                  className="font-mono text-[13px] font-semibold text-[#1A5C2A]"
                >
                  +€{marge}/u
                </p>
                <p className="text-right text-[10px] text-[#B0AFA9]">marge</p>
              </>
            )}
            <div className="flex flex-wrap justify-end gap-3 text-[11px] text-[#8A8A85]">
              <span>
                Kand.{" "}
                <strong className="font-mono font-semibold text-[#1A1A18]">
                  {uurtariefKandidaat != null ? `€${uurtariefKandidaat}` : "—"}
                </strong>
              </span>
              <span>
                Klant{" "}
                <strong className="font-mono font-semibold text-[#1A1A18]">
                  {uurtariefOpdrachtgever != null
                    ? `€${uurtariefOpdrachtgever}`
                    : "—"}
                </strong>
              </span>
            </div>
          </div>
        </div>

        <div className="flex flex-col flex-wrap gap-[10px] border-t border-[rgba(0,0,0,0.05)] bg-[#FAFAF8] px-5 py-3 md:flex-row md:items-center md:justify-between">
          <div className="flex min-w-[200px] flex-1 flex-wrap items-center gap-2">
            <span className="whitespace-nowrap text-[12px] font-medium text-[#1A1A18]">
              {startdatum ? formatDateNl(startdatum) : "—"}
            </span>
            <div className="relative h-1 min-w-[60px] flex-1 overflow-hidden rounded-[2px] bg-[#EFEDE8]">
              <div
                className="absolute left-0 top-0 h-full rounded-[2px]"
                style={{
                  width: `${pct}%`,
                  background: pct > 80 ? "#C8A45A" : "#5C8A5C",
                }}
              />
            </div>
            <span className="whitespace-nowrap text-[12px] font-medium text-[#1A1A18]">
              {einddatum ? formatDateNl(einddatum) : "—"}
            </span>
            <span className="whitespace-nowrap text-[11px] text-[#8A8A85]">
              {pctLabel}
            </span>
          </div>

          <div className="flex flex-shrink-0 flex-wrap gap-1.5 md:justify-end">
            <Link
              href={`/berichten?kandidaat=${kandidaatId}`}
              className="cursor-pointer rounded-md border border-[rgba(26,92,42,0.1)] bg-[#D4EDD8] px-3 py-1.5 text-[12px] font-medium text-[#1A5C2A] transition-all duration-[120ms]"
            >
              WhatsApp
            </Link>
            <button
              type="button"
              disabled={busy === id || status === "beëindigd"}
              onClick={() => beeindig(id)}
              className="cursor-pointer rounded-md border border-[rgba(139,32,32,0.12)] bg-[#F5D9D9] px-3 py-1.5 text-[12px] font-medium text-[#8B2020] transition-all duration-[120ms] disabled:cursor-not-allowed disabled:opacity-50"
            >
              Beëindigen
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
