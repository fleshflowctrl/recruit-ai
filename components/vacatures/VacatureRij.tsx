"use client";

import Link from "next/link";
import type { Vacature } from "@/lib/types";
import { cn, formatEuro } from "@/lib/utils";

function statusBarColor(status: string): string {
  switch (status) {
    case "open":
      return "#5C8A5C";
    case "gesloten":
      return "#B0AFA9";
    case "geannuleerd":
      return "#C05050";
    default:
      return "#B0AFA9";
  }
}

function StatusBadge({ status }: { status: string }) {
  if (status === "open") {
    return (
      <span
        className="inline-flex items-center gap-1 rounded-[20px] px-2 py-0.5 text-[11px] font-medium"
        style={{ background: "#D4EDD8", color: "#1A5C2A" }}
      >
        <span
          className="h-[5px] w-[5px] shrink-0 rounded-full"
          style={{ background: "#5C8A5C" }}
        />
        open
      </span>
    );
  }
  if (status === "gesloten") {
    return (
      <span
        className="inline-flex items-center gap-1 rounded-[20px] px-2 py-0.5 text-[11px] font-medium"
        style={{ background: "#EFEDE8", color: "#8A8A85" }}
      >
        <span
          className="h-[5px] w-[5px] shrink-0 rounded-full"
          style={{ background: "#B0AFA9" }}
        />
        gesloten
      </span>
    );
  }
  if (status === "geannuleerd") {
    return (
      <span
        className="inline-flex items-center gap-1 rounded-[20px] px-2 py-0.5 text-[11px] font-medium"
        style={{ background: "#F5D9D9", color: "#8B2020" }}
      >
        <span
          className="h-[5px] w-[5px] shrink-0 rounded-full"
          style={{ background: "#C05050" }}
        />
        geannuleerd
      </span>
    );
  }
  return (
    <span
      className="inline-flex items-center gap-1 rounded-[20px] px-2 py-0.5 text-[11px] font-medium"
      style={{ background: "#EFEDE8", color: "#8A8A85" }}
    >
      <span
        className="h-[5px] w-[5px] shrink-0 rounded-full"
        style={{ background: "#B0AFA9" }}
      />
      {status}
    </span>
  );
}

export type VacatureRijProps = {
  vacature: Vacature;
  opdrachtgeverNaam?: string;
  href: string;
};

export function VacatureRij({ vacature, opdrachtgeverNaam, href }: VacatureRijProps) {
  const dimmed =
    vacature.status === "gesloten" || vacature.status === "geannuleerd";
  const salarisTekst = formatEuro(vacature.salaris_min, vacature.salaris_max);
  const hasSalaris = salarisTekst !== "—";
  const eisenTags = (vacature.eisen ?? []).slice(0, 4);

  return (
    <div
      className={cn(
        "relative grid grid-cols-1 items-start gap-4 overflow-hidden rounded-[10px] border border-black/[0.07] bg-white transition-all duration-150",
        "hover:border-black/[0.15] hover:bg-[#FEFEFE] hover:translate-x-0.5",
        "sm:grid-cols-[1fr_auto] sm:items-center sm:gap-4",
      )}
      style={{
        padding: "18px 20px",
        cursor: "pointer",
        opacity: dimmed ? 0.65 : 1,
      }}
    >
      <span
        className="absolute bottom-0 left-0 top-0 w-[3px]"
        style={{ background: statusBarColor(vacature.status) }}
        aria-hidden
      />
      <Link
        href={href}
        className="absolute inset-0 z-[1]"
        aria-label={`Vacature ${vacature.titel}`}
      />
      <div className="relative z-[2] min-w-0 pl-1 pointer-events-none">
        <h3
          className="mb-1.5 truncate text-[15px] font-semibold"
          style={{ color: "#1A1A18" }}
        >
          {vacature.titel}
        </h3>
        <div
          className="mb-0 flex flex-wrap items-center gap-3 text-[12px]"
          style={{ color: "#8A8A85" }}
        >
          {vacature.locatie ? (
            <span className="inline-flex items-center gap-1">
              <span aria-hidden>📍</span>
              {vacature.locatie}
            </span>
          ) : null}
          {opdrachtgeverNaam ? (
            <span className="inline-flex items-center gap-1">
              <span aria-hidden>🏢</span>
              {opdrachtgeverNaam}
            </span>
          ) : null}
          {vacature.uren_per_week != null ? (
            <span className="inline-flex items-center gap-1">
              <span aria-hidden>⏰</span>
              {vacature.uren_per_week} uur/week
            </span>
          ) : null}
          <span
            className="inline-flex items-center gap-1 rounded-md border border-black/[0.06] px-2 py-0.5 text-[12px]"
            style={{ background: "#F5F4F0", color: "#8A8A85" }}
          >
            Gezocht:{" "}
            <span
              className="font-mono font-semibold"
              style={{ color: "#1A1A18" }}
            >
              {vacature.aantal_gezocht}
            </span>
          </span>
        </div>
        {eisenTags.length > 0 ? (
          <div className="mt-2 flex flex-wrap gap-[5px]">
            {eisenTags.map((tag, i) => (
              <span
                key={`${vacature.id}-eis-${i}-${tag}`}
                className="whitespace-nowrap rounded-[5px] border border-black/[0.06] px-[7px] py-0.5 text-[11px]"
                style={{ background: "#F5F4F0", color: "#8A8A85" }}
              >
                {tag}
              </span>
            ))}
          </div>
        ) : null}
      </div>

      <div
        className={cn(
          "relative z-[2] flex w-full shrink-0 flex-col items-end gap-2.5 pointer-events-none",
          "max-sm:items-start sm:w-auto sm:max-w-none",
        )}
      >
        <div className="flex w-full flex-col items-end max-sm:items-start">
          <span
            className="whitespace-nowrap text-[15px] font-semibold font-mono"
            style={{ color: "#1A1A18" }}
          >
            {hasSalaris ? salarisTekst : "—"}
          </span>
          {hasSalaris ? (
            <span
              className="-mt-1.5 text-[11px]"
              style={{ color: "#B0AFA9" }}
            >
              per maand
            </span>
          ) : null}
        </div>

        <StatusBadge status={vacature.status} />

        <div className="flex flex-wrap gap-1.5 pointer-events-auto">
          <Link
            href={href}
            className="rounded-md px-3 py-1.5 text-[12px] font-medium whitespace-nowrap transition-all duration-[120ms] hover:bg-[#EFEDE8]"
            style={{ background: "#1A1A18", color: "#FAFAF8", border: "none" }}
          >
            Bekijken
          </Link>
          {vacature.status === "open" ? (
            <Link
              href={`/campagnes/nieuw?vacature=${vacature.id}`}
              className="rounded-md border border-black/[0.09] bg-[#F5F4F0] px-3 py-1.5 text-[12px] font-medium whitespace-nowrap transition-all duration-[120ms] hover:bg-[#EFEDE8]"
            >
              Campagne
            </Link>
          ) : null}
          {vacature.status === "gesloten" ? (
            <Link
              href={href}
              className="rounded-md border border-black/[0.09] bg-[#F5F4F0] px-3 py-1.5 text-[12px] font-medium whitespace-nowrap transition-all duration-[120ms] hover:bg-[#EFEDE8]"
            >
              Heropenen
            </Link>
          ) : null}
        </div>
      </div>
    </div>
  );
}
