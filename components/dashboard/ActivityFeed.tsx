"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { format } from "date-fns";
import { nl } from "date-fns/locale";

type Line = {
  id: string;
  naam: string;
  aanbeveling: string | null;
  score: number | null;
  at: string;
};

function initialsFromNaam(naam: string): string {
  const parts = naam.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (
    (parts[0][0] ?? "") + (parts[parts.length - 1][0] ?? "")
  ).toUpperCase();
}

function avatarBg(aanbeveling: string | null): string {
  const k = (aanbeveling ?? "").toUpperCase().replace(/\s+/g, "_");
  if (k === "GESCHIKT") return "#5C8A5C";
  if (k === "TWIJFEL") return "#C8A45A";
  if (k === "NIET_GESCHIKT") return "#C05050";
  return "#B0AFA9";
}

function resultLabelAndColor(aanbeveling: string | null): {
  label: string;
  color: string;
} {
  if (aanbeveling == null || aanbeveling === "") {
    return { label: "Geen aanbeveling", color: "#B0AFA9" };
  }
  const k = aanbeveling.toUpperCase().replace(/\s+/g, "_");
  switch (k) {
    case "GESCHIKT":
      return { label: "Geschikt", color: "#1A5C2A" };
    case "TWIJFEL":
      return { label: "Twijfel", color: "#7A5C10" };
    case "NIET_GESCHIKT":
      return { label: "Niet geschikt", color: "#8B2020" };
    case "GEEN_GEHOOR":
      return { label: "Geen gehoor", color: "#B0AFA9" };
    default:
      return {
        label: String(aanbeveling).replace(/_/g, " "),
        color: "#B0AFA9",
      };
  }
}

export function ActivityFeed({ bureauId }: { bureauId: string }) {
  const [lines, setLines] = useState<Line[]>([]);

  useEffect(() => {
    const supabase = createClient();

    async function load() {
      const { data: gesprekken } = await supabase
        .from("gesprekken")
        .select("id, aanbeveling, aangemaakt_op, score, kandidaten(naam)")
        .eq("bureau_id", bureauId)
        .order("aangemaakt_op", { ascending: false })
        .limit(10);

      const mapped: Line[] = (gesprekken ?? []).map((g) => {
        const k = g.kandidaten as { naam?: string } | null;
        return {
          id: g.id,
          naam: k?.naam ?? "Kandidaat",
          aanbeveling: g.aanbeveling,
          score: g.score,
          at: g.aangemaakt_op,
        };
      });
      setLines(mapped);
    }

    load();

    const sub = supabase
      .channel("activiteit")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "gesprekken",
          filter: `bureau_id=eq.${bureauId}`,
        },
        () => {
          load();
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(sub);
    };
  }, [bureauId]);

  return (
    <ul className="list-none p-0">
      {lines.length === 0 && (
        <li className="text-[14px] text-[#B0AFA9]">Nog geen activiteit.</li>
      )}
      {lines.map((l, idx) => {
        const res = resultLabelAndColor(l.aanbeveling);
        const isLast = idx === lines.length - 1;
        return (
          <li
            key={l.id}
            className={`flex items-center gap-3 py-2.5 ${
              idx === 0 ? "pt-0" : ""
            } ${isLast ? "border-b-0 pb-0" : "border-b border-[rgba(0,0,0,0.05)]"}`}
          >
            <span
              className="flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-full text-[11px] font-semibold text-[#FAFAF8]"
              style={{ background: avatarBg(l.aanbeveling) }}
            >
              {initialsFromNaam(l.naam)}
            </span>
            <div className="min-w-0 flex-1">
              <div className="text-[13px] font-medium text-[#1A1A18]">
                {l.naam}
              </div>
              <div className="mt-px text-[11px]" style={{ color: res.color }}>
                <span>{res.label}</span>
                {l.score != null && (
                  <span className="ml-1.5 font-mono font-semibold tabular-nums">
                    {" "}
                    · {l.score}
                  </span>
                )}
              </div>
            </div>
            <span className="shrink-0 font-mono text-[11px] text-[#B0AFA9]">
              {format(new Date(l.at), "d MMM HH:mm", { locale: nl })}
            </span>
          </li>
        );
      })}
    </ul>
  );
}
