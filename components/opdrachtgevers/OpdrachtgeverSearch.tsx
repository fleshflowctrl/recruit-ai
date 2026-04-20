"use client";

import { useMemo, useState } from "react";
import type { Opdrachtgever } from "@/lib/types";
import { OpdrachtgeverKaart } from "./OpdrachtgeverKaart";

export type OpdrachtgeverSearchProps = {
  opdrachtgevers: Opdrachtgever[];
  vacatureCounts: Record<string, number>;
};

export function OpdrachtgeverSearch({
  opdrachtgevers,
  vacatureCounts,
}: OpdrachtgeverSearchProps) {
  const [searchQuery, setSearchQuery] = useState("");

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return opdrachtgevers;
    return opdrachtgevers.filter((o) => {
      const naam = (o.naam ?? "").toLowerCase();
      const sector = (o.sector ?? "").toLowerCase();
      return naam.includes(q) || sector.includes(q);
    });
  }, [opdrachtgevers, searchQuery]);

  const hasData = opdrachtgevers.length > 0;
  const noResults = hasData && filtered.length === 0;

  return (
    <div className="space-y-4">
      <div className="relative max-w-[400px]">
        <span
          className="pointer-events-none absolute left-3 top-1/2 z-[1] -translate-y-1/2 text-[#B0AFA9]"
          aria-hidden
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="11" cy="11" r="7" />
            <path d="M21 21l-4.3-4.3" />
          </svg>
        </span>
        <input
          type="search"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Zoek op naam of sector..."
          className="w-full rounded-lg border border-[rgba(0,0,0,0.09)] bg-[#F5F4F0] py-2.5 pl-9 pr-3 text-[13px] text-[#1A1A18] outline-none transition-colors focus:border-[rgba(0,0,0,0.22)] focus:bg-white"
          aria-label="Zoek op naam of sector"
        />
      </div>

      {noResults ? (
        <p className="text-[13px] text-[#8A8A85]">
          Geen opdrachtgevers gevonden voor uw zoekopdracht.
        </p>
      ) : (
        <div
          className="grid gap-3"
          style={{
            gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
          }}
        >
          {filtered.map((o) => (
            <OpdrachtgeverKaart
              key={o.id}
              opdrachtgever={o}
              vacatureCount={vacatureCounts[o.id] ?? 0}
              href={`/opdrachtgevers/${o.id}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
