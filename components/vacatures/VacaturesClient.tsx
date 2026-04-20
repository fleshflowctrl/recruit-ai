"use client";

import { Search } from "lucide-react";
import { useMemo, useState } from "react";
import type { Vacature } from "@/lib/types";
import { cn } from "@/lib/utils";
import { VacatureRij } from "./VacatureRij";

export type VacaturesClientProps = {
  vacatures: Vacature[];
  opdrachtgevers: Record<string, string>;
};

type TabId = "alle" | "open" | "gesloten";

export function VacaturesClient({
  vacatures,
  opdrachtgevers,
}: VacaturesClientProps) {
  const [activeTab, setActiveTab] = useState<TabId>("alle");
  const [searchQuery, setSearchQuery] = useState("");

  const countAlle = vacatures.length;
  const countOpen = useMemo(
    () => vacatures.filter((v) => v.status === "open").length,
    [vacatures],
  );
  const countGesloten = useMemo(
    () =>
      vacatures.filter(
        (v) => v.status === "gesloten" || v.status === "geannuleerd",
      ).length,
    [vacatures],
  );

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return vacatures
      .filter((v) => {
        if (activeTab === "alle") return true;
        if (activeTab === "open") return v.status === "open";
        return v.status === "gesloten" || v.status === "geannuleerd";
      })
      .filter(
        (v) =>
          !q ||
          v.titel.toLowerCase().includes(q) ||
          (v.locatie?.toLowerCase().includes(q) ?? false),
      );
  }, [vacatures, activeTab, searchQuery]);

  const tabs: { id: TabId; label: string; count: number }[] = [
    { id: "alle", label: "Alle", count: countAlle },
    { id: "open", label: "Open", count: countOpen },
    { id: "gesloten", label: "Gesloten", count: countGesloten },
  ];

  const showFilteredEmpty = filtered.length === 0 && vacatures.length > 0;

  return (
    <div>
      <div
        className={cn(
          "mb-5 flex flex-col gap-2.5",
          "sm:flex-row sm:flex-wrap sm:items-center sm:justify-between",
        )}
      >
        <div
          className="flex gap-1 rounded-[10px] p-1"
          style={{ background: "#F5F4F0" }}
          role="tablist"
        >
          {tabs.map((tab) => {
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "flex cursor-pointer items-center gap-1.5 whitespace-nowrap rounded-[7px] border-none px-3.5 py-1.5 text-[13px] font-medium transition-all duration-150",
                  active
                    ? "bg-[#FAFAF8] text-[#1A1A18] shadow-[0_1px_3px_rgba(0,0,0,0.08)]"
                    : "bg-transparent text-[#8A8A85]",
                )}
              >
                {tab.label}
                <span
                  className={cn(
                    "rounded-[10px] px-1.5 py-px text-[11px] font-semibold",
                    active
                      ? "bg-[#D4EDD8] text-[#1A5C2A]"
                      : "bg-[#EFEDE8] text-[#8A8A85]",
                  )}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        <div className="relative w-full sm:w-auto">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#B0AFA9]"
            aria-hidden
          />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Zoek vacature..."
            className="w-full rounded-lg border border-black/[0.09] bg-[#F5F4F0] py-2 pl-[34px] pr-3 text-[13px] outline-none transition-colors focus:border-black/[0.22] sm:w-[220px]"
          />
        </div>
      </div>

      <div className="flex flex-col gap-0.5">
        {filtered.map((v) => (
          <VacatureRij
            key={v.id}
            vacature={v}
            opdrachtgeverNaam={opdrachtgevers[v.opdrachtgever_id ?? ""]}
            href={`/vacatures/${v.id}`}
          />
        ))}
      </div>

      {showFilteredEmpty ? (
        <p
          className="py-5 text-center text-[13px]"
          style={{ color: "#8A8A85" }}
        >
          Geen vacatures gevonden voor deze filter.
        </p>
      ) : null}
    </div>
  );
}
