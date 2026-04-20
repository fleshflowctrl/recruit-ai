"use client";

import Link from "next/link";
import type { Kandidaat } from "@/lib/types";
import { formatPhoneNl } from "@/lib/utils";

function initialsFromNaam(naam: string): string {
  const parts = naam.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (
    (parts[0][0] ?? "") + (parts[parts.length - 1][0] ?? "")
  ).toUpperCase();
}

function topBarColor(status: string): string {
  switch (status) {
    case "actief":
      return "#5C8A5C";
    case "geplaatst":
      return "#4A7AB4";
    case "inactief":
      return "#B0AFA9";
    default:
      return "#B0AFA9";
  }
}

function avatarBg(score: number | null): string {
  if (score == null) return "#B0AFA9";
  if (score >= 8) return "#5C8A5C";
  if (score >= 6) return "#C8A45A";
  return "#B0AFA9";
}

function scoreCircleClasses(score: number | null): {
  bg: string;
  color: string;
} {
  if (score == null) {
    return { bg: "#EFEDE8", color: "#B0AFA9" };
  }
  if (score >= 8) {
    return { bg: "#D4EDD8", color: "#1A5C2A" };
  }
  if (score >= 6) {
    return { bg: "#F5EBC8", color: "#7A5C10" };
  }
  return { bg: "#EFEDE8", color: "#B0AFA9" };
}

function buildTags(sectoren: string[] | null, skills: string[] | null): {
  tags: string[];
  hoofdIndex: number;
} {
  const s = sectoren ?? [];
  const sk = skills ?? [];
  const tags: string[] = [];
  const seen = new Set<string>();
  const push = (t: string) => {
    if (tags.length >= 4) return;
    const k = t.trim();
    if (!k || seen.has(k)) return;
    seen.add(k);
    tags.push(k);
  };
  if (sk[0]) push(sk[0]);
  for (const x of s) push(x);
  for (const x of sk.slice(1)) push(x);
  const hoofdIndex = tags.length > 0 ? 0 : -1;
  return { tags, hoofdIndex };
}

function statusBadgeConfig(status: string): {
  label: string;
  bg: string;
  color: string;
  dot: string;
} {
  switch (status) {
    case "actief":
      return {
        label: "Actief",
        bg: "#D4EDD8",
        color: "#1A5C2A",
        dot: "#5C8A5C",
      };
    case "geplaatst":
      return {
        label: "Geplaatst",
        bg: "#D4E4F7",
        color: "#1D4A7A",
        dot: "#4A7AB4",
      };
    case "niet_beschikbaar":
      return {
        label: "Niet beschikbaar",
        bg: "#EFEDE8",
        color: "#8A8A85",
        dot: "#B0AFA9",
      };
    default:
      return {
        label: "Inactief",
        bg: "#EFEDE8",
        color: "#8A8A85",
        dot: "#B0AFA9",
      };
  }
}

export type KandidaatKaartProps = {
  kandidaat: Kandidaat;
  gemiddeldeScore: number | null;
  href: string;
};

export function KandidaatKaart({
  kandidaat: k,
  gemiddeldeScore,
  href,
}: KandidaatKaartProps) {
  const { tags, hoofdIndex } = buildTags(k.sectoren, k.skills);
  const badge = statusBadgeConfig(k.status);
  const sc = scoreCircleClasses(gemiddeldeScore);
  const salarisTonen =
    k.salariswens_min != null || k.salariswens_max != null;

  return (
    <div
      className="flex h-full cursor-pointer flex-col overflow-hidden rounded-xl border border-[rgba(0,0,0,0.08)] bg-white transition-all duration-[180ms] hover:-translate-y-0.5 hover:border-[rgba(0,0,0,0.16)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.07)]"
    >
      <div
        className="h-[3px] shrink-0 rounded-t-[12px]"
        style={{ background: topBarColor(k.status) }}
      />
      <div className="flex flex-1 flex-col px-4 pb-4 pt-3.5">
        <div className="mb-3 flex items-start justify-between gap-2">
          <div className="flex min-w-0 flex-1 gap-2.5">
            <span
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-semibold text-[#FAFAF8]"
              style={{ background: avatarBg(gemiddeldeScore) }}
            >
              {initialsFromNaam(k.naam)}
            </span>
            <div className="min-w-0">
              <div
                className="max-w-[130px] truncate whitespace-nowrap text-sm font-semibold text-[#1A1A18]"
                title={k.naam}
              >
                {k.naam}
              </div>
              <div className="mt-px text-[11px] text-[#8A8A85]">
                {formatPhoneNl(k.telefoon)}
              </div>
            </div>
          </div>
          <div
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[13px] font-bold font-mono"
            style={{ background: sc.bg, color: sc.color }}
          >
            {gemiddeldeScore != null ? gemiddeldeScore : "—"}
          </div>
        </div>

        {tags.length > 0 && (
          <div className="mb-2.5 flex flex-wrap gap-[5px]">
            {tags.map((tag, i) => {
              const highlight = i === hoofdIndex && hoofdIndex >= 0;
              return (
                <span
                  key={`${tag}-${i}`}
                  className="whitespace-nowrap rounded-md border border-solid px-2 py-0.5 text-[11px]"
                  style={
                    highlight
                      ? {
                          background: "#D4EDD8",
                          color: "#1A5C2A",
                          borderColor: "rgba(26,92,42,0.1)",
                        }
                      : {
                          background: "#F5F4F0",
                          color: "#8A8A85",
                          borderColor: "rgba(0,0,0,0.06)",
                        }
                  }
                >
                  {tag}
                </span>
              );
            })}
          </div>
        )}

        <div className="mb-2.5 flex flex-wrap gap-2.5 text-[11px] text-[#8A8A85]">
          <span>
            Beschikbaar{" "}
            <strong className="font-medium text-[#1A1A18]">
              {k.beschikbaar_per?.trim() ? k.beschikbaar_per : "onbekend"}
            </strong>
          </span>
          {salarisTonen && (
            <span>
              Salaris{" "}
              <strong className="font-medium text-[#1A1A18]">
                €
                {k.salariswens_min != null && k.salariswens_max != null
                  ? `${k.salariswens_min.toLocaleString("nl-NL")}–€${k.salariswens_max.toLocaleString("nl-NL")}`
                  : k.salariswens_min != null
                    ? `vanaf €${k.salariswens_min.toLocaleString("nl-NL")}`
                    : k.salariswens_max != null
                      ? `tot €${k.salariswens_max.toLocaleString("nl-NL")}`
                      : ""}
              </strong>
            </span>
          )}
        </div>

        <div className="mb-3 inline-flex max-w-full items-center gap-1 rounded-[20px] px-2 py-0.5 text-[11px] font-medium w-fit"
          style={{ background: badge.bg, color: badge.color }}
        >
          <span
            className="h-1.5 w-1.5 shrink-0 rounded-full"
            style={{ background: badge.dot }}
          />
          {badge.label}
        </div>

        <div className="mt-auto flex gap-1.5 border-t border-[rgba(0,0,0,0.05)] pt-3">
          <Link
            href={href}
            className="flex-1 whitespace-nowrap rounded-md border border-transparent bg-[#1A1A18] py-1.5 px-1 text-center text-xs font-medium text-[#FAFAF8] transition-all duration-150 hover:opacity-90"
          >
            Bekijken
          </Link>
          <Link
            href={`${href}?bel=1`}
            className="flex-1 whitespace-nowrap rounded-md border border-[rgba(0,0,0,0.09)] bg-[#F5F4F0] py-1.5 px-1 text-center text-xs font-medium text-[#1A1A18] transition-all duration-150 hover:bg-[#EFEDE8]"
          >
            Bellen
          </Link>
          <Link
            href={`${href}?whatsapp=1`}
            className="flex-1 whitespace-nowrap rounded-md border border-[rgba(26,92,42,0.1)] bg-[#D4EDD8] py-1.5 px-1 text-center text-xs font-medium text-[#1A5C2A] transition-all duration-150 hover:opacity-90"
          >
            WhatsApp
          </Link>
        </div>
      </div>
    </div>
  );
}
