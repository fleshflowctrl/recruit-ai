"use client";

import { useMemo, useState, useEffect } from "react";
import { format } from "date-fns";
import { nl } from "date-fns/locale";
import { BerichtBubble } from "./BerichtBubble";
import { createClient } from "@/lib/supabase/client";
import toast from "react-hot-toast";

type B = {
  id: string;
  inhoud: string;
  richting: string;
  aangemaakt_op: string;
  kandidaat_id: string | null;
  gelezen?: boolean | null;
  kandidaten?: { naam?: string } | null;
};

export function BerichtenGrouped({
  initial,
  bureauId,
  initialKandidaatId,
}: {
  initial: B[];
  bureauId: string;
  initialKandidaatId?: string | null;
}) {
  const [lines, setLines] = useState(initial);
  const [selectedId, setSelectedId] = useState<string | null>(
    initialKandidaatId ?? null,
  );
  const [draft, setDraft] = useState("");
  const [verzenden, setVerzenden] = useState(false);

  const totalOngelezen = useMemo(
    () =>
      lines.filter(
        (b) => b.richting === "inbound" && b.gelezen === false,
      ).length,
    [lines],
  );

  const grouped = useMemo(() => {
    const m = new Map<
      string,
      { naam: string; items: B[]; lastAt: string; unread: boolean }
    >();
    for (const b of lines) {
      const kid = b.kandidaat_id ?? "";
      if (!kid) continue;
      const naam =
        (b.kandidaten as { naam?: string } | null)?.naam ?? "Kandidaat";
      const g = m.get(kid) ?? {
        naam,
        items: [] as B[],
        lastAt: b.aangemaakt_op,
        unread: false,
      };
      g.items.push(b);
      if (b.aangemaakt_op > g.lastAt) g.lastAt = b.aangemaakt_op;
      if (b.richting === "inbound" && b.gelezen === false) g.unread = true;
      m.set(kid, g);
    }
    for (const g of m.values()) {
      g.items.sort(
        (a, b) =>
          new Date(a.aangemaakt_op).getTime() -
          new Date(b.aangemaakt_op).getTime(),
      );
    }
    return m;
  }, [lines]);

  useEffect(() => {
    const supabase = createClient();
    const sub = supabase
      .channel("berichten-feed")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "berichten",
          filter: `bureau_id=eq.${bureauId}`,
        },
        async () => {
          const { data } = await supabase
            .from("berichten")
            .select("*, kandidaten(naam)")
            .eq("bureau_id", bureauId)
            .order("aangemaakt_op", { ascending: true });
          setLines((data as B[]) ?? []);
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(sub);
    };
  }, [bureauId]);

  useEffect(() => {
    if (initialKandidaatId) setSelectedId(initialKandidaatId);
  }, [initialKandidaatId]);

  useEffect(() => {
    if (!selectedId) return;
    const supabase = createClient();
    void supabase
      .from("berichten")
      .update({ gelezen: true })
      .eq("bureau_id", bureauId)
      .eq("kandidaat_id", selectedId)
      .eq("richting", "inbound")
      .then(() => {
        setLines((prev) =>
          prev.map((b) =>
            b.kandidaat_id === selectedId && b.richting === "inbound"
              ? { ...b, gelezen: true }
              : b,
          ),
        );
      });
  }, [selectedId, bureauId]);

  async function verstuur() {
    if (!selectedId || !draft.trim() || verzenden) return;
    setVerzenden(true);
    const t = toast.loading("Verzenden…");
    try {
      const res = await fetch("/api/whatsapp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kandidaatId: selectedId,
          message: draft,
          type: "custom",
        }),
      });
      const j = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(j.error ?? "Mislukt");
      setDraft("");
      toast.success("WhatsApp bericht verzonden.", { id: t });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Fout", { id: t });
    } finally {
      setVerzenden(false);
    }
  }

  const selected = selectedId ? grouped.get(selectedId) : null;

  const list = [...grouped.entries()].sort(
    (a, b) =>
      new Date(b[1].lastAt).getTime() - new Date(a[1].lastAt).getTime(),
  );

  return (
    <div className="grid gap-6 lg:grid-cols-5">
      <div className="rounded-2xl border border-border bg-white p-4 shadow-sm lg:col-span-2">
        <div className="flex items-center justify-between gap-2">
          <h2 className="font-serif text-lg">Gesprekken</h2>
          {totalOngelezen > 0 && (
            <span className="rounded-full bg-primary px-2 py-0.5 text-xs font-semibold text-white">
              {totalOngelezen} ongelezen
            </span>
          )}
        </div>
        <ul className="mt-3 max-h-[560px] space-y-2 overflow-y-auto">
          {list.length === 0 && (
            <li className="rounded-xl border border-dashed border-border bg-slate-50/80 p-4 text-sm text-muted">
              Nog geen berichten. Berichten verschijnen hier zodra kandidaten
              reageren of wanneer u WhatsApp vanuit een kandidaat verstuurt.
            </li>
          )}
          {list.map(([kid, g]) => {
            const ongelezenInThread = g.items.filter(
              (b) => b.richting === "inbound" && b.gelezen === false,
            ).length;
            return (
            <li key={kid}>
              <button
                type="button"
                onClick={() => setSelectedId(kid)}
                className={`flex w-full flex-col rounded-xl border px-3 py-2 text-left text-sm transition-colors ${
                  selectedId === kid
                    ? "border-primary bg-blue-50"
                    : "border-border hover:bg-slate-50"
                }`}
              >
                <span className="font-medium text-slate-900">{g.naam}</span>
                <span className="line-clamp-1 text-xs text-muted">
                  {g.items[g.items.length - 1]?.inhoud ?? ""}
                </span>
                <span className="mt-1 flex items-center gap-2 text-[10px] text-muted">
                  {format(new Date(g.lastAt), "PPp", { locale: nl })}
                  {ongelezenInThread > 0 && (
                    <span className="rounded-full bg-primary px-2 py-0.5 text-[10px] font-medium text-white">
                      {ongelezenInThread}
                    </span>
                  )}
                </span>
              </button>
            </li>
            );
          })}
        </ul>
      </div>

      <div className="rounded-2xl border border-border bg-white p-4 shadow-sm lg:col-span-3">
        {!selectedId || !selected ? (
          <p className="text-sm text-muted">
            Selecteer een gesprek of stuur een eerste bericht vanaf de
            kandidaatpagina.
          </p>
        ) : (
          <>
            <h3 className="font-serif text-lg">{selected.naam}</h3>
            <div className="mt-4 flex max-h-[400px] flex-col gap-2 overflow-y-auto rounded-xl bg-slate-50/80 p-3">
              {selected.items.map((b) => (
                <BerichtBubble
                  key={b.id}
                  richting={b.richting}
                  inhoud={b.inhoud}
                  tijd={format(new Date(b.aangemaakt_op), "PPp", { locale: nl })}
                />
              ))}
            </div>
            <div className="mt-4 flex flex-col gap-2 sm:flex-row">
              <input
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder="Typ een bericht…"
                className="flex-1 rounded-xl border border-border px-3 py-2 text-sm"
              />
              <button
                type="button"
                onClick={verstuur}
                disabled={!draft.trim() || verzenden}
                className="rounded-xl bg-accent px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
              >
                {verzenden ? "Verzenden…" : "Stuur bericht"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
