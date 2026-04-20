"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useState, useTransition } from "react";

export type KandidatenCounts = {
  alle: number;
  actief: number;
  geplaatst: number;
  inactief: number;
};

const TABS: { value: string; label: string; countKey: keyof KandidatenCounts }[] =
  [
    { value: "", label: "Alle", countKey: "alle" },
    { value: "actief", label: "Actief", countKey: "actief" },
    { value: "geplaatst", label: "Geplaatst", countKey: "geplaatst" },
    { value: "inactief", label: "Inactief", countKey: "inactief" },
  ];

export function KandidatenFilters({ counts }: { counts: KandidatenCounts }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [pending, startTransition] = useTransition();
  const [q, setQ] = useState(searchParams.get("q") ?? "");

  const push = useCallback(
    (updates: Record<string, string>) => {
      const p = new URLSearchParams(searchParams.toString());
      Object.entries(updates).forEach(([k, v]) => {
        if (!v) p.delete(k);
        else p.set(k, v);
      });
      p.delete("page");
      startTransition(() => {
        router.push(`/kandidaten?${p.toString()}`);
      });
    },
    [router, searchParams],
  );

  const currentStatus = searchParams.get("status") ?? "";

  return (
    <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:flex-wrap lg:items-center lg:gap-2.5">
      <div className="-mx-1 flex max-w-full gap-1 overflow-x-auto whitespace-nowrap px-1 pb-1 lg:mx-0 lg:pb-0">
        <div
          className="flex w-fit gap-1 rounded-[10px] p-1"
          style={{ background: "#F5F4F0" }}
        >
          {TABS.map((tab) => {
            const active = currentStatus === tab.value;
            const count = counts[tab.countKey];
            return (
              <button
                key={tab.value || "alle"}
                type="button"
                className="flex cursor-pointer items-center gap-1.5 whitespace-nowrap rounded-md border-none px-3.5 py-1.5 text-[13px] font-medium transition-all duration-150"
                style={
                  active
                    ? {
                        background: "#FAFAF8",
                        color: "#1A1A18",
                        boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
                      }
                    : {
                        background: "transparent",
                        color: "#8A8A85",
                      }
                }
                onClick={() => push({ status: tab.value })}
              >
                {tab.label}
                <span
                  className="rounded-[10px] px-1.5 py-px text-[11px] font-semibold"
                  style={
                    active
                      ? {
                          background: "#D4EDD8",
                          color: "#1A5C2A",
                        }
                      : {
                          background: "#EFEDE8",
                          color: "#8A8A85",
                        }
                  }
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="relative min-w-[200px] flex-1">
        <span
          className="pointer-events-none absolute left-3 top-1/2 z-[1] -translate-y-1/2 text-[13px] text-[#B0AFA9]"
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
          className="w-full rounded-lg border border-[rgba(0,0,0,0.09)] bg-[#F5F4F0] py-2.5 pl-9 pr-3 text-[13px] text-[#1A1A18] outline-none transition-colors focus:border-[rgba(0,0,0,0.22)] focus:bg-white"
          placeholder="Naam of telefoon"
          defaultValue={searchParams.get("q") ?? ""}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") push({ q });
          }}
        />
      </div>

      <select
        className="cursor-pointer rounded-md border border-[rgba(0,0,0,0.09)] bg-[#F5F4F0] px-3 py-2 text-[13px] text-[#1A1A18] outline-none"
        defaultValue={searchParams.get("rijbewijs") ?? ""}
        onChange={(e) => push({ rijbewijs: e.target.value })}
      >
        <option value="">Alles</option>
        <option value="ja">Ja</option>
        <option value="nee">Nee</option>
      </select>

      {pending && (
        <span className="text-xs text-[#B0AFA9]">Bezig…</span>
      )}
    </div>
  );
}
