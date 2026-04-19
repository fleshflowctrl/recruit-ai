"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { format } from "date-fns";
import { nl } from "date-fns/locale";

type Line = { id: string; text: string; at: string };

export function ActivityFeed({ bureauId }: { bureauId: string }) {
  const [lines, setLines] = useState<Line[]>([]);

  useEffect(() => {
    const supabase = createClient();

    async function load() {
      const { data: gesprekken } = await supabase
        .from("gesprekken")
        .select("id, aanbeveling, aangemaakt_op, kandidaten(naam)")
        .eq("bureau_id", bureauId)
        .order("aangemaakt_op", { ascending: false })
        .limit(10);

      const mapped: Line[] = (gesprekken ?? []).map((g) => {
        const k = g.kandidaten as { naam?: string } | null;
        const naam = k?.naam ?? "Kandidaat";
        const rec = g.aanbeveling ?? "—";
        return {
          id: g.id,
          text: `AI belde ${naam} — ${rec}`,
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
    <ul className="space-y-3 text-sm text-slate-700">
      {lines.length === 0 && (
        <li className="text-muted">Nog geen activiteit.</li>
      )}
      {lines.map((l) => (
        <li key={l.id} className="rounded-xl border border-border bg-slate-50/80 px-3 py-2">
          <span>{l.text}</span>
          <span className="mt-1 block text-xs text-muted">
            {format(new Date(l.at), "HH:mm", { locale: nl })}
          </span>
        </li>
      ))}
    </ul>
  );
}
