"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { format } from "date-fns";
import { nl } from "date-fns/locale";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { ScoreBadge } from "@/components/ui/ScoreBadge";

type Line = {
  id: string;
  naam: string;
  aanbeveling: string | null;
  score: number | null;
  at: string;
};

function activityDotColor(aanbeveling: string | null): string {
  const k = (aanbeveling ?? "").toLowerCase().replace(/\s+/g, "_");
  if (k === "geschikt") return "#5C8A5C";
  if (k === "twijfel") return "#C8A45A";
  if (k === "niet_geschikt") return "#C05050";
  if (k === "geen_gehoor") return "var(--cream-faint)";
  return "var(--cream-faint)";
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
    <ul className="space-y-4 text-sm text-[color:var(--cream-text)]">
      {lines.length === 0 && (
        <li className="text-[14px] text-[color:var(--cream-faint)]">
          Nog geen activiteit.
        </li>
      )}
      {lines.map((l) => (
        <li key={l.id} className="flex gap-3">
          <span
            className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full"
            style={{ background: activityDotColor(l.aanbeveling) }}
            aria-hidden
          />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
              <span className="font-medium">{l.naam}</span>
              <ScoreBadge score={l.score} />
              {l.aanbeveling ? (
                <StatusBadge status={l.aanbeveling} />
              ) : (
                <span className="text-xs text-[color:var(--cream-muted)]">
                  Geen aanbeveling
                </span>
              )}
            </div>
            <span className="mt-0.5 block text-xs text-[color:var(--cream-muted)]">
              {format(new Date(l.at), "d MMM yyyy HH:mm", { locale: nl })}
            </span>
          </div>
        </li>
      ))}
    </ul>
  );
}
