"use client";

import { ListFilter } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import type { Opdrachtgever } from "@/lib/types";
import { OpdrachtgeverKaart } from "./OpdrachtgeverKaart";

export type OpdrachtgeverSearchProps = {
  opdrachtgevers: Opdrachtgever[];
  vacatureCounts: Record<string, number>;
};

type VacatureFilter = "all" | "with" | "without";

export function OpdrachtgeverSearch({
  opdrachtgevers,
  vacatureCounts,
}: OpdrachtgeverSearchProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterOpen, setFilterOpen] = useState(false);
  const [sectorFilter, setSectorFilter] = useState("");
  const [vacatureFilter, setVacatureFilter] = useState<VacatureFilter>("all");
  const panelRef = useRef<HTMLDivElement>(null);

  const sectorOptions = useMemo(() => {
    const set = new Set<string>();
    for (const o of opdrachtgevers) {
      const s = o.sector?.trim();
      if (s) set.add(s);
    }
    return Array.from(set).sort((a, b) =>
      a.localeCompare(b, "nl", { sensitivity: "base" }),
    );
  }, [opdrachtgevers]);

  const hasActiveFilters =
    Boolean(sectorFilter) || vacatureFilter !== "all";

  useEffect(() => {
    if (!filterOpen) return;
    function handleMouseDown(e: MouseEvent) {
      const el = panelRef.current;
      if (el && !el.contains(e.target as Node)) {
        setFilterOpen(false);
      }
    }
    document.addEventListener("mousedown", handleMouseDown);
    return () => document.removeEventListener("mousedown", handleMouseDown);
  }, [filterOpen]);

  const filtered = useMemo(() => {
    let list = opdrachtgevers;

    if (sectorFilter) {
      list = list.filter(
        (o) => (o.sector ?? "").trim() === sectorFilter,
      );
    }

    if (vacatureFilter === "with") {
      list = list.filter((o) => (vacatureCounts[o.id] ?? 0) > 0);
    } else if (vacatureFilter === "without") {
      list = list.filter((o) => (vacatureCounts[o.id] ?? 0) === 0);
    }

    const q = searchQuery.trim().toLowerCase();
    if (q) {
      list = list.filter((o) => {
        const naam = (o.naam ?? "").toLowerCase();
        const sector = (o.sector ?? "").toLowerCase();
        return naam.includes(q) || sector.includes(q);
      });
    }

    return list;
  }, [
    opdrachtgevers,
    searchQuery,
    sectorFilter,
    vacatureFilter,
    vacatureCounts,
  ]);

  const hasData = opdrachtgevers.length > 0;
  const noResults = hasData && filtered.length === 0;

  function resetFilters() {
    setSectorFilter("");
    setVacatureFilter("all");
  }

  return (
    <div className="space-y-4">
      <div
        ref={panelRef}
        className="flex w-full flex-col gap-3 sm:flex-row sm:items-center sm:gap-3"
      >
        <div className="relative min-w-0 w-full flex-1">
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

        <div className="relative shrink-0 sm:self-center">
          <button
            type="button"
            onClick={() => setFilterOpen((o) => !o)}
            className="flex w-full items-center justify-center gap-2 rounded-lg border border-[rgba(0,0,0,0.13)] bg-[#F5F4F0] px-4 py-2.5 text-[13px] font-medium text-[#1A1A18] transition-colors hover:bg-[#EFEDE8] sm:w-auto sm:min-w-[120px]"
            aria-expanded={filterOpen}
            aria-haspopup="true"
            aria-controls="opdrachtgever-filter-panel"
            id="opdrachtgever-filter-trigger"
          >
            <ListFilter className="h-4 w-4 shrink-0 text-[#8A8A85]" aria-hidden />
            Filter
            {hasActiveFilters && (
              <span
                className="h-2 w-2 shrink-0 rounded-full bg-[#5C8A5C]"
                title="Filters actief"
                aria-hidden
              />
            )}
          </button>

          {filterOpen && (
            <div
              id="opdrachtgever-filter-panel"
              role="dialog"
              aria-labelledby="opdrachtgever-filter-trigger"
              className="absolute right-0 top-full z-30 mt-2 w-full min-w-[min(100vw-2rem,280px)] rounded-xl border border-[rgba(0,0,0,0.08)] bg-white p-4 shadow-[0_8px_24px_rgba(0,0,0,0.08)] sm:w-[280px]"
            >
              <div className="mb-3 flex items-center justify-between gap-2">
                <span className="text-[12px] font-semibold uppercase tracking-wide text-[#8A8A85]">
                  Filteren
                </span>
                {hasActiveFilters && (
                  <button
                    type="button"
                    onClick={resetFilters}
                    className="text-[12px] font-medium text-[#1A5C2A] underline-offset-2 hover:underline"
                  >
                    Wis filters
                  </button>
                )}
              </div>

              <label className="mb-3 block">
                <span className="mb-1.5 block text-[11px] font-medium text-[#8A8A85]">
                  Sector
                </span>
                <select
                  value={sectorFilter}
                  onChange={(e) => setSectorFilter(e.target.value)}
                  className="w-full cursor-pointer rounded-md border border-[rgba(0,0,0,0.09)] bg-[#F5F4F0] px-3 py-2 text-[13px] text-[#1A1A18] outline-none focus:border-[rgba(0,0,0,0.22)]"
                >
                  <option value="">Alle sectoren</option>
                  {sectorOptions.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className="mb-1.5 block text-[11px] font-medium text-[#8A8A85]">
                  Open vacatures
                </span>
                <select
                  value={vacatureFilter}
                  onChange={(e) =>
                    setVacatureFilter(e.target.value as VacatureFilter)
                  }
                  className="w-full cursor-pointer rounded-md border border-[rgba(0,0,0,0.09)] bg-[#F5F4F0] px-3 py-2 text-[13px] text-[#1A1A18] outline-none focus:border-[rgba(0,0,0,0.22)]"
                >
                  <option value="all">Alle opdrachtgevers</option>
                  <option value="with">Met open vacatures</option>
                  <option value="without">Zonder open vacatures</option>
                </select>
              </label>
            </div>
          )}
        </div>
      </div>

      {noResults ? (
        <p className="text-[13px] text-[#8A8A85]">
          Geen opdrachtgevers gevonden voor uw zoekopdracht of filters.
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
