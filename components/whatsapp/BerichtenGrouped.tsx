"use client";

import Link from "next/link";
import { Search } from "lucide-react";
import { useMemo, useState, useEffect, useRef } from "react";
import { format, isToday, isYesterday } from "date-fns";
import { nl } from "date-fns/locale";
import { BerichtBubble } from "./BerichtBubble";
import { createClient } from "@/lib/supabase/client";
import toast from "react-hot-toast";
import { cn } from "@/lib/utils";

type B = {
  id: string;
  inhoud: string;
  richting: string;
  aangemaakt_op: string;
  kandidaat_id: string | null;
  gelezen?: boolean | null;
  kandidaten?: { naam?: string } | null;
};

const AVATAR_COLORS = [
  "#5C8A5C",
  "#4A7AB4",
  "#C8A45A",
  "#8A6C9C",
  "#B07A5C",
] as const;

function avatarColor(naam: string, hasUnreadInbound: boolean): string {
  if (hasUnreadInbound) return "#1A1A18";
  const code = naam.length ? naam.charCodeAt(0) : 0;
  return AVATAR_COLORS[Math.abs(code) % AVATAR_COLORS.length] ?? AVATAR_COLORS[0];
}

function getInitials(naam: string): string {
  const parts = naam.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0]!.slice(0, 1).toUpperCase();
  return (
    parts[0]!.slice(0, 1) + parts[parts.length - 1]!.slice(0, 1)
  ).toUpperCase();
}

function formatSidebarListTime(d: Date): string {
  if (isToday(d)) return format(d, "HH:mm");
  if (isYesterday(d)) return "gisteren";
  const dagen = ["zo", "ma", "di", "wo", "do", "vr", "za"];
  return dagen[d.getDay()] ?? "";
}

function groupItemsByCalendarDay(items: B[]) {
  const result: { label: string; items: B[] }[] = [];
  let lastKey = "";
  for (const b of items) {
    const d = new Date(b.aangemaakt_op);
    const key = format(d, "yyyy-MM-dd");
    const label = format(d, "d MMMM yyyy", { locale: nl });
    if (key !== lastKey) {
      lastKey = key;
      result.push({ label, items: [b] });
    } else {
      result[result.length - 1]!.items.push(b);
    }
  }
  return result;
}

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
  const [search, setSearch] = useState("");

  const messagesContainerRef = useRef<HTMLDivElement>(null);

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

  const selected = selectedId ? grouped.get(selectedId) : null;

  useEffect(() => {
    const id = requestAnimationFrame(() => {
      const el = messagesContainerRef.current;
      if (!el) return;
      el.scrollTop = el.scrollHeight;
    });
    return () => cancelAnimationFrame(id);
  }, [selectedId, lines, selected?.items]);

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

  const list = [...grouped.entries()].sort(
    (a, b) =>
      new Date(b[1].lastAt).getTime() - new Date(a[1].lastAt).getTime(),
  );

  const filteredList = list.filter(([, g]) =>
    g.naam.toLowerCase().includes(search.trim().toLowerCase()),
  );

  const dayGroups =
    selected?.items?.length ? groupItemsByCalendarDay(selected.items) : [];

  return (
    <div className="flex min-h-0 flex-1 flex-col border-t border-[rgba(0,0,0,0.07)]">
      <div className="grid min-h-0 flex-1 grid-cols-1 md:grid-cols-[280px_1fr]">
        {/* Sidebar */}
        <aside
          className={cn(
            "flex min-h-0 flex-col border-[rgba(0,0,0,0.07)] bg-[#FAFAF8] md:border-r",
            selectedId ? "hidden md:flex" : "flex",
          )}
        >
          <div className="flex flex-shrink-0 items-center justify-between border-b border-[rgba(0,0,0,0.06)] px-3.5 py-3">
            <span className="text-[13px] font-semibold text-[#1A1A18]">
              Gesprekken
            </span>
            {totalOngelezen > 0 && (
              <span className="rounded-[20px] bg-[#1A1A18] px-2.5 py-0.5 text-[11px] font-semibold text-[#FAFAF8]">
                {totalOngelezen} ongelezen
              </span>
            )}
          </div>
          <div className="relative flex-shrink-0 border-b border-[rgba(0,0,0,0.05)] px-3.5 py-2.5">
            <Search
              className="pointer-events-none absolute left-[22px] top-1/2 h-3 w-3 -translate-y-1/2 text-[#B0AFA9]"
              strokeWidth={2}
              aria-hidden
            />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Zoeken…"
              className="w-full rounded-lg border border-[rgba(0,0,0,0.08)] bg-[#F5F4F0] py-[7px] pl-7 pr-2.5 text-[13px] text-[#1A1A18] outline-none placeholder:text-[#B0AFA9]"
            />
          </div>
          <ul className="min-h-0 flex-1 overflow-y-auto">
            {filteredList.length === 0 && (
              <li className="px-4 py-4 text-[13px] text-[#B0AFA9]">
                {list.length === 0
                  ? "Nog geen berichten."
                  : "Geen resultaten."}
              </li>
            )}
            {filteredList.map(([kid, g]) => {
              const ongelezenInThread = g.items.filter(
                (b) => b.richting === "inbound" && b.gelezen === false,
              ).length;
              const last = g.items[g.items.length - 1];
              const bg = avatarColor(g.naam, g.unread);
              const active = selectedId === kid;
              const lastAt = new Date(g.lastAt);
              return (
                <li key={kid}>
                  <button
                    type="button"
                    onClick={() => setSelectedId(kid)}
                    className={cn(
                      "flex w-full cursor-pointer items-center gap-2.5 border-b border-[rgba(0,0,0,0.04)] py-3 pl-3 pr-3.5 text-left transition-colors duration-100",
                      active
                        ? "border-l-2 border-l-[#1A1A18] bg-[#F5F4F0] pl-[10px]"
                        : "border-l-2 border-l-transparent hover:bg-[#F5F4F0]",
                    )}
                  >
                    <div
                      className="flex h-[38px] w-[38px] flex-shrink-0 items-center justify-center rounded-full text-[12px] font-bold text-[#FAFAF8]"
                      style={{ background: bg }}
                    >
                      {getInitials(g.naam)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="truncate text-[13px] font-semibold text-[#1A1A18]">
                          {g.naam}
                        </span>
                        <span className="flex-shrink-0 font-mono text-[10px] text-[#B0AFA9]">
                          {formatSidebarListTime(lastAt)}
                        </span>
                      </div>
                      <div className="mt-0.5 flex items-center justify-between gap-2">
                        <span className="max-w-[180px] truncate text-[12px] text-[#8A8A85]">
                          {last?.inhoud ?? ""}
                        </span>
                        {ongelezenInThread > 0 && (
                          <span
                            className="h-2 w-2 flex-shrink-0 rounded-full bg-[#1A1A18]"
                            aria-hidden
                          />
                        )}
                      </div>
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        </aside>

        {/* Chat */}
        <section
          className={cn(
            "flex min-h-0 flex-col bg-white",
            selectedId ? "flex" : "hidden md:flex",
          )}
        >
          {!selectedId || !selected ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-2 px-6">
              <span className="text-[32px] opacity-20" aria-hidden>
                💬
              </span>
              <p className="text-center text-[13px] text-[#B0AFA9]">
                Selecteer een gesprek
              </p>
            </div>
          ) : (
            <>
              <header className="flex flex-shrink-0 flex-wrap items-center gap-2.5 border-b border-[rgba(0,0,0,0.06)] px-5 py-3.5">
                <button
                  type="button"
                  className="flex-shrink-0 text-[13px] text-[#8A8A85] md:hidden"
                  onClick={() => setSelectedId(null)}
                >
                  ← Terug
                </button>
                <div
                  className="flex h-[34px] w-[34px] flex-shrink-0 items-center justify-center rounded-full text-[11px] font-bold text-[#FAFAF8]"
                  style={{
                    background: avatarColor(
                      selected.naam,
                      selected.unread,
                    ),
                  }}
                >
                  {getInitials(selected.naam)}
                </div>
                <div className="min-w-0 flex flex-col">
                  <span className="text-[14px] font-semibold text-[#1A1A18]">
                    {selected.naam}
                  </span>
                  <span className="truncate font-mono text-[11px] text-[#8A8A85]">
                    Kandidaat-ID: {selectedId}
                  </span>
                </div>
                <Link
                  href={`/kandidaten/${selectedId}`}
                  className="ml-auto flex-shrink-0 rounded-md border border-[rgba(0,0,0,0.08)] bg-[#F5F4F0] px-3 py-1 text-[12px] text-[#8A8A85] no-underline transition-colors hover:bg-[#EFEDE8]"
                >
                  Kandidaat bekijken →
                </Link>
              </header>

              <div
                ref={messagesContainerRef}
                className="flex min-h-0 flex-1 flex-col gap-2.5 overflow-y-auto bg-[#FAFAF8] px-5 py-4"
              >
                {dayGroups.map((day) => (
                  <div key={day.label} className="flex flex-col gap-2.5">
                    <div className="flex items-center gap-2">
                      <div className="h-px flex-1 bg-[rgba(0,0,0,0.07)]" />
                      <span className="text-[11px] text-[#B0AFA9]">
                        {day.label}
                      </span>
                      <div className="h-px flex-1 bg-[rgba(0,0,0,0.07)]" />
                    </div>
                    {day.items.map((b) => (
                      <BerichtBubble
                        key={b.id}
                        richting={b.richting}
                        inhoud={b.inhoud}
                        tijd={format(
                          new Date(b.aangemaakt_op),
                          "HH:mm",
                        )}
                      />
                    ))}
                  </div>
                ))}
              </div>

              <div className="flex flex-shrink-0 gap-2 border-t border-[rgba(0,0,0,0.06)] bg-white px-4 py-3">
                <textarea
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      void verstuur();
                    }
                  }}
                  placeholder="Typ een bericht..."
                  rows={1}
                  className="min-h-[40px] flex-1 resize-none rounded-lg border border-[rgba(0,0,0,0.09)] bg-[#F5F4F0] px-3.5 py-2 text-[13px] text-[#1A1A18] outline-none focus:border-[rgba(0,0,0,0.22)]"
                />
                <button
                  type="button"
                  onClick={verstuur}
                  disabled={!draft.trim() || verzenden}
                  className="whitespace-nowrap rounded-lg border-none bg-[#1A1A18] px-[18px] py-2 text-[13px] font-medium text-[#FAFAF8] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {verzenden ? "Verzenden…" : "Stuur bericht"}
                </button>
              </div>
            </>
          )}
        </section>
      </div>
    </div>
  );
}
