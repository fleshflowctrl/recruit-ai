"use client";

import Link from "next/link";
import { User, Phone, MapPin } from "lucide-react";
import type { Opdrachtgever } from "@/lib/types";
import { formatPhoneNl } from "@/lib/utils";

function initialsFromNaam(naam: string): string {
  const parts = naam.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  const a = parts[0][0] ?? "";
  const b = parts[parts.length - 1][0] ?? "";
  return (a + b).toUpperCase();
}

function barColorForSector(sector: string | null): string {
  const s = (sector ?? "").toLowerCase();
  if (/industrie|metaal|techniek/.test(s)) return "#5C8A5C";
  if (/logistiek|transport/.test(s)) return "#4A7AB4";
  if (/bouw|constructie/.test(s)) return "#C8A45A";
  if (/handel|retail/.test(s)) return "#B0AFA9";
  return "#8A8A85";
}

function telHref(telefoon: string | null): string | null {
  if (!telefoon?.trim()) return null;
  return `tel:${telefoon.replace(/\s+/g, "")}`;
}

export type OpdrachtgeverKaartProps = {
  opdrachtgever: Opdrachtgever;
  vacatureCount: number;
  href: string;
};

export function OpdrachtgeverKaart({
  opdrachtgever: o,
  vacatureCount,
  href,
}: OpdrachtgeverKaartProps) {
  const bar = barColorForSector(o.sector);
  const canCall = Boolean(telHref(o.telefoon));

  const vacatureLabel =
    vacatureCount === 1
      ? "1 vacature"
      : vacatureCount === 0
        ? "0 vacatures"
        : `${vacatureCount} vacatures`;

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-xl border border-[rgba(0,0,0,0.08)] bg-white transition-all duration-[180ms] hover:-translate-y-0.5 hover:border-[rgba(0,0,0,0.16)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.07)]">
      <div
        className="h-[3px] shrink-0 rounded-t-[12px]"
        style={{ background: bar }}
      />
      <div className="flex flex-1 flex-col p-4">
        <div className="mb-3 flex items-start justify-between gap-2">
          <div className="flex min-w-0 flex-1 gap-2.5">
            <span
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] text-sm font-bold text-[#FAFAF8]"
              style={{ background: bar }}
            >
              {initialsFromNaam(o.naam)}
            </span>
            <div className="min-w-0">
              <div
                className="max-w-[150px] truncate whitespace-nowrap text-[15px] font-semibold text-[#1A1A18]"
                title={o.naam}
              >
                {o.naam}
              </div>
              <span
                className="mt-0.5 inline-flex max-w-full rounded-md border border-[rgba(0,0,0,0.06)] bg-[#F5F4F0] px-2 py-0.5 text-[11px] font-medium text-[#8A8A85]"
              >
                {o.sector?.trim() ? o.sector : "—"}
              </span>
            </div>
          </div>
          <span
            className="inline-flex shrink-0 items-center gap-1 rounded-[20px] border border-solid px-2 py-0.5 text-[11px] font-medium"
            style={
              vacatureCount > 0
                ? {
                    background: "#D4EDD8",
                    color: "#1A5C2A",
                    borderColor: "rgba(26,92,42,0.1)",
                  }
                : {
                    background: "#F5EBC8",
                    color: "#7A5C10",
                    borderColor: "rgba(122,92,16,0.1)",
                  }
            }
          >
            {vacatureLabel}
          </span>
        </div>

        <div className="mb-3.5 flex flex-col gap-1.5">
          <div className="flex items-center gap-2 text-xs text-[#8A8A85]">
            <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded bg-[#F5F4F0] text-[10px] text-[#8A8A85]">
              <User className="h-3 w-3" aria-hidden />
            </span>
            <span>
              Contactpersoon{" "}
              <strong className="font-medium text-[#1A1A18]">
                {o.contactpersoon?.trim() ? o.contactpersoon : "—"}
              </strong>
            </span>
          </div>
          <div className="flex items-center gap-2 text-xs text-[#8A8A85]">
            <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded bg-[#F5F4F0] text-[10px] text-[#8A8A85]">
              <Phone className="h-3 w-3" aria-hidden />
            </span>
            <span>
              Telefoon{" "}
              <strong className="font-medium text-[#1A1A18]">
                {o.telefoon?.trim() ? formatPhoneNl(o.telefoon) : "—"}
              </strong>
            </span>
          </div>
          <div className="flex items-center gap-2 text-xs text-[#8A8A85]">
            <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded bg-[#F5F4F0] text-[10px] text-[#8A8A85]">
              <MapPin className="h-3 w-3" aria-hidden />
            </span>
            <span className="min-w-0">
              Adres{" "}
              <strong className="font-medium text-[#1A1A18]">
                {o.adres?.trim() ? o.adres : "—"}
              </strong>
            </span>
          </div>
        </div>

        <div className="mt-auto flex gap-1.5 border-t border-[rgba(0,0,0,0.05)] pt-3">
          <Link
            href={href}
            className="flex-1 whitespace-nowrap rounded-md border border-transparent bg-[#1A1A18] py-1.5 px-1 text-center text-xs font-medium text-[#FAFAF8] transition-all duration-150 hover:opacity-[0.85]"
          >
            Bekijken
          </Link>
          <Link
            href={`/vacatures?opdrachtgever=${o.id}`}
            className="flex-1 whitespace-nowrap rounded-md border border-[rgba(0,0,0,0.09)] bg-[#F5F4F0] py-1.5 px-1 text-center text-xs font-medium text-[#1A1A18] transition-all duration-150 hover:bg-[#EFEDE8]"
          >
            Vacatures
          </Link>
          {canCall && (
            <a
              href={telHref(o.telefoon)!}
              className="flex-1 whitespace-nowrap rounded-md border border-[rgba(0,0,0,0.09)] bg-[#F5F4F0] py-1.5 px-1 text-center text-xs font-medium text-[#1A1A18] transition-all duration-150 hover:bg-[#EFEDE8]"
            >
              Bellen
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
