"use client";

import { useState } from "react";
import { PlaatsingenKaart, type PlaatsingRow } from "./PlaatsingenKaart";

type TabId = "alle" | "actief" | "bevestigd" | "beeindigd";

export function PlaatsingenClient({
  rows,
  bureauId,
}: {
  rows: PlaatsingRow[];
  bureauId: string;
}) {
  const [activeTab, setActiveTab] = useState<TabId>("alle");

  const filtered = rows.filter((r) => {
    if (activeTab === "alle") return true;
    if (activeTab === "beeindigd") return r.status === "beëindigd";
    if (activeTab === "bevestigd")
      return (
        r.status === "bevestigd" ||
        r.status === "bevestigd_door_kandidaat"
      );
    return r.status === activeTab;
  });

  const tabs: { id: TabId; label: string }[] = [
    { id: "alle", label: "Alle" },
    { id: "actief", label: "Actief" },
    { id: "bevestigd", label: "Bevestigd" },
    { id: "beeindigd", label: "Beëindigd" },
  ];

  return (
    <div>
      <div
        className="mb-5 flex w-fit flex-wrap gap-1 rounded-[10px] bg-[#F5F4F0] p-1"
      >
        {tabs.map((tab) => {
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`cursor-pointer whitespace-nowrap rounded-[7px] border-none px-[14px] py-1.5 text-[13px] font-medium transition-all duration-150 ${
                active
                  ? "bg-[#FAFAF8] text-[#1A1A18] shadow-[0_1px_3px_rgba(0,0,0,0.08)]"
                  : "bg-transparent text-[#8A8A85]"
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      <div className="flex flex-col gap-3">
        {filtered.length === 0 ? (
          <p className="px-6 py-6 text-center text-[13px] text-[#B0AFA9]">
            Geen plaatsingen in deze weergave.
          </p>
        ) : (
          filtered.map((row) => (
            <PlaatsingenKaart key={row.id} {...row} bureauId={bureauId} />
          ))
        )}
      </div>
    </div>
  );
}
