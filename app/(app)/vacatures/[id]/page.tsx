import Link from "next/link";
import { format } from "date-fns";
import { nl } from "date-fns/locale";
import { notFound, redirect } from "next/navigation";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { createClient } from "@/lib/supabase/server";
import { getSessionContext } from "@/lib/auth";
import { formatEuro, formatPhoneNl } from "@/lib/utils";
import type { Vacature } from "@/lib/types";

type OpdrachtgeverRow = {
  id: string;
  naam: string;
  contactpersoon: string | null;
  telefoon: string | null;
};

type KandidaatEmbed = {
  id: string;
  naam: string;
  telefoon: string;
};

type GesprekRow = {
  id: string;
  campagne_id: string | null;
  status: string;
  score: number | null;
  aanbeveling: string | null;
  kandidaten: KandidaatEmbed | null;
};

type CampagneKandidaatRow = {
  kandidaat_id: string;
  status: string;
};

const TABLE_HEADERS = [
  "Kandidaat",
  "Telefoon",
  "Status",
  "Score",
  "Actie",
] as const;

export default async function VacatureDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const ctx = await getSessionContext();
  if (!ctx) redirect("/login");
  const { id } = await params;

  const supabase = await createClient();
  const { data: v } = await supabase
    .from("vacatures")
    .select("*")
    .eq("id", id)
    .eq("bureau_id", ctx.bureau.id)
    .single();

  if (!v) notFound();

  const vacature = v as Vacature;

  let opdrachtgever: OpdrachtgeverRow | null = null;
  if (vacature.opdrachtgever_id) {
    const { data: og } = await supabase
      .from("opdrachtgevers")
      .select("id, naam, contactpersoon, telefoon")
      .eq("id", vacature.opdrachtgever_id)
      .single();
    opdrachtgever = og;
  }

  const { data: campagnes } = await supabase
    .from("campagnes")
    .select("id")
    .eq("vacature_id", vacature.id)
    .eq("bureau_id", ctx.bureau.id);

  const campagneIds = (campagnes ?? []).map((c) => c.id);

  const { data: gesprekkenRaw } = campagneIds.length
    ? await supabase
        .from("gesprekken")
        .select("*, kandidaten(id, naam, telefoon)")
        .in("campagne_id", campagneIds)
        .order("aangemaakt_op", { ascending: false })
    : { data: [] as GesprekRow[] | null };

  const gesprekken = (gesprekkenRaw ?? []) as GesprekRow[];

  const { data: campagneKandidatenRaw } = campagneIds.length
    ? await supabase
        .from("campagne_kandidaten")
        .select("kandidaat_id, status")
        .in("campagne_id", campagneIds)
    : { data: [] as CampagneKandidaatRow[] | null };

  const campagneKandidaten = (campagneKandidatenRaw ??
    []) as CampagneKandidaatRow[];

  const totaalGescreend =
    gesprekken.filter((g) => g.status === "voltooid").length ?? 0;

  const geschikt =
    gesprekken.filter((g) => g.aanbeveling === "GESCHIKT").length ?? 0;

  const twijfel =
    gesprekken.filter((g) => g.aanbeveling === "TWIJFEL").length ?? 0;

  const nietGeschikt =
    gesprekken.filter((g) => g.aanbeveling === "NIET_GESCHIKT").length ?? 0;

  const geenGehoor =
    gesprekken.filter((g) => g.status === "geen_antwoord").length ?? 0;

  const pct =
    totaalGescreend > 0 ? Math.round((geschikt / totaalGescreend) * 100) : 0;

  const { data: plaatsingen } = await supabase
    .from("plaatsingen")
    .select("id")
    .eq("vacature_id", vacature.id)
    .eq("bureau_id", ctx.bureau.id);

  const geplaatst = plaatsingen?.length ?? 0;

  const nogTeBellen = campagneKandidaten.filter(
    (ck) => ck.status === "wacht",
  ).length;

  const salarisTekst = formatEuro(vacature.salaris_min, vacature.salaris_max);
  const hasSalaris = salarisTekst !== "—";

  const infoGrid: [string, string][] = [
    ["Opdrachtgever", opdrachtgever?.naam ?? "—"],
    ["Locatie", vacature.locatie ?? "—"],
    ["Uren/week", vacature.uren_per_week ? `${vacature.uren_per_week} uur` : "—"],
    [
      "Gezocht",
      vacature.aantal_gezocht ? `${vacature.aantal_gezocht} personen` : "—",
    ],
    [
      "Startdatum",
      vacature.startdatum
        ? format(new Date(vacature.startdatum), "d MMM yyyy", { locale: nl })
        : "—",
    ],
    ["Status", vacature.status],
  ];

  const statRows: [string, string | number, boolean][] = [
    ["Totaal gescreend", totaalGescreend, false],
    ["Geschikt", geschikt, true],
    ["Geschiktheid", `${pct}%`, true],
    ["Geplaatst", geplaatst, true],
    ["Nog te bellen", nogTeBellen, false],
  ];

  return (
    <PageWrapper className="space-y-5 p-4 md:p-6 lg:p-8">
      <Link
        href="/vacatures"
        className="inline-block text-[13px]"
        style={{ color: "#8A8A85" }}
      >
        ← Terug naar vacatures
      </Link>

      {/* HERO */}
      <div
        className="flex flex-col gap-6 rounded-[14px] bg-[#1A1A18] p-7 lg:flex-row lg:items-start lg:justify-between"
      >
        <div className="flex min-w-0 flex-1 flex-col gap-2.5">
          <h1
            className="text-[22px] font-semibold"
            style={{ color: "#F5F4F0" }}
          >
            {vacature.titel}
          </h1>

          <div
            className="flex flex-wrap gap-2.5 text-[12px]"
            style={{ color: "rgba(245,244,240,0.5)" }}
          >
            {vacature.locatie ? (
              <span>
                📍 {vacature.locatie}
              </span>
            ) : null}
            {opdrachtgever?.naam ? (
              <span>
                🏢 {opdrachtgever.naam}
              </span>
            ) : null}
            {vacature.uren_per_week != null && vacature.uren_per_week > 0 ? (
              <span>
                ⏰ {vacature.uren_per_week} uur/week
              </span>
            ) : null}
            {vacature.startdatum ? (
              <span>
                📅 Start{" "}
                {format(new Date(vacature.startdatum), "d MMM yyyy", {
                  locale: nl,
                })}
              </span>
            ) : null}
          </div>

          {(vacature.eisen ?? []).length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {(vacature.eisen ?? []).map((e, i) => (
                <span
                  key={`${vacature.id}-eis-${i}-${e}`}
                  className="whitespace-nowrap rounded-md border border-white/10 px-2.5 py-1 text-[11px]"
                  style={{
                    background: "rgba(255,255,255,0.08)",
                    color: "rgba(245,244,240,0.65)",
                  }}
                >
                  {e}
                </span>
              ))}
            </div>
          ) : null}

          <div className="flex flex-wrap gap-2">
            <Link
              href={`/campagnes/nieuw?vacature=${vacature.id}`}
              className="inline-flex items-center whitespace-nowrap rounded-lg border-none px-[18px] py-2.5 text-[13px] font-medium no-underline"
              style={{
                background: "#F5F4F0",
                color: "#1A1A18",
              }}
            >
              + Nieuwe campagne
            </Link>
            <Link
              href={`/vacatures/${vacature.id}/bewerken`}
              className="inline-flex items-center whitespace-nowrap rounded-lg border border-white/10 px-[18px] py-2.5 text-[13px] no-underline"
              style={{
                background: "rgba(255,255,255,0.07)",
                color: "rgba(245,244,240,0.65)",
              }}
            >
              Bewerken
            </Link>
          </div>
        </div>

        <div className="flex w-full shrink-0 flex-col items-stretch gap-2.5 lg:w-auto lg:items-end">
          <div>
            <div
              className="text-right font-mono text-[22px] font-semibold whitespace-nowrap"
              style={{ color: "#F5F4F0" }}
            >
              {salarisTekst}
            </div>
            {hasSalaris ? (
              <div
                className="text-right text-[11px]"
                style={{ color: "rgba(245,244,240,0.35)" }}
              >
                per maand
              </div>
            ) : null}
          </div>
          <div className="flex justify-start lg:justify-end">
            <StatusBadge status={vacature.status} />
          </div>
        </div>
      </div>

      {/* MAIN GRID */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_300px]">
        {/* LEFT — Kandidaten */}
        <div>
          <div
            className="overflow-hidden rounded-xl border border-black/[0.07] bg-white"
          >
            <div
              className="flex items-center justify-between border-b border-black/[0.06] px-[18px] py-3.5"
            >
              <span
                className="text-[10px] font-semibold uppercase tracking-[0.1em]"
                style={{ color: "#B0AFA9" }}
              >
                Gescreende kandidaten
              </span>
              <span className="text-[12px]" style={{ color: "#8A8A85" }}>
                {gesprekken.length} kandidaten
              </span>
            </div>

            {totaalGescreend > 0 && (
              <div className="border-b border-black/[0.04] px-[18px] py-3.5">
                <div
                  className="mb-1.5 flex h-1.5 gap-0.5 overflow-hidden rounded-[3px]"
                >
                  {geschikt > 0 ? (
                    <div
                      className="min-w-0 rounded-sm"
                      style={{ flex: geschikt, background: "#5C8A5C" }}
                    />
                  ) : null}
                  {twijfel > 0 ? (
                    <div
                      className="min-w-0 rounded-sm"
                      style={{ flex: twijfel, background: "#C8A45A" }}
                    />
                  ) : null}
                  {nietGeschikt > 0 ? (
                    <div
                      className="min-w-0 rounded-sm"
                      style={{ flex: nietGeschikt, background: "#C05050" }}
                    />
                  ) : null}
                  {geenGehoor > 0 ? (
                    <div
                      className="min-w-0 rounded-sm"
                      style={{ flex: geenGehoor, background: "#B0AFA9" }}
                    />
                  ) : null}
                </div>
                <div className="flex flex-wrap gap-2.5 text-[11px]">
                  {geschikt > 0 ? (
                    <span style={{ color: "#1A5C2A" }}>
                      ■ {geschikt} geschikt
                    </span>
                  ) : null}
                  {twijfel > 0 ? (
                    <span style={{ color: "#7A5C10" }}>
                      ■ {twijfel} twijfel
                    </span>
                  ) : null}
                  {nietGeschikt > 0 ? (
                    <span style={{ color: "#8B2020" }}>
                      ■ {nietGeschikt} niet geschikt
                    </span>
                  ) : null}
                  {geenGehoor > 0 ? (
                    <span style={{ color: "#8A8A85" }}>
                      ■ {geenGehoor} geen gehoor
                    </span>
                  ) : null}
                </div>
              </div>
            )}

            <div className="overflow-x-auto">
              <div className="min-w-[720px]">
                <div
                  className="grid border-b border-black/[0.06] bg-[#F5F4F0] px-[18px] py-2.5"
                  style={{
                    gridTemplateColumns: "2fr 1fr 110px 80px 80px",
                  }}
                >
                  {TABLE_HEADERS.map((h) => (
                    <div
                      key={h}
                      className="text-[10px] font-semibold uppercase tracking-[0.08em]"
                      style={{ color: "#B0AFA9" }}
                    >
                      {h}
                    </div>
                  ))}
                </div>

                {gesprekken.length === 0 ? (
                  <div
                    className="px-[18px] py-8 text-center text-[13px]"
                    style={{ color: "#B0AFA9" }}
                  >
                    Nog geen kandidaten gescreend.
                  </div>
                ) : (
                  gesprekken.map((g) => {
                    const k = g.kandidaten;
                    if (!k) return null;

                    const words = k.naam.split(/\s+/).filter(Boolean);
                    const chars = words.map((w) => w[0]).filter(Boolean) as string[];
                    const initials =
                      chars.length === 0
                        ? "?"
                        : chars
                            .filter(
                              (_, i, a) => i === 0 || i === a.length - 1,
                            )
                            .join("")
                            .toUpperCase();

                    const avatarColor =
                      g.aanbeveling === "GESCHIKT"
                        ? "#5C8A5C"
                        : g.aanbeveling === "TWIJFEL"
                          ? "#C8A45A"
                          : g.aanbeveling === "NIET_GESCHIKT"
                            ? "#C05050"
                            : "#B0AFA9";

                    const ckStatus = campagneKandidaten.find(
                      (ck) => ck.kandidaat_id === k.id,
                    )?.status;

                    const statusProp =
                      ckStatus ??
                      (g.aanbeveling?.toLowerCase() as string | undefined) ??
                      "wacht";

                    return (
                      <div
                        key={g.id}
                        className="grid items-center border-b border-black/[0.04] px-[18px] py-3"
                        style={{
                          gridTemplateColumns: "2fr 1fr 110px 80px 80px",
                        }}
                      >
                        <div className="flex min-w-0 items-center gap-2">
                          <div
                            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold"
                            style={{
                              background: avatarColor,
                              color: "#FAFAF8",
                            }}
                          >
                            {initials}
                          </div>
                          <Link
                            href={`/kandidaten/${k.id}`}
                            className="truncate text-[13px] font-medium no-underline"
                            style={{ color: "#1A1A18" }}
                          >
                            {k.naam}
                          </Link>
                        </div>
                        <div
                          className="text-[12px]"
                          style={{ color: "#8A8A85" }}
                        >
                          {formatPhoneNl(k.telefoon)}
                        </div>
                        <div>
                          <StatusBadge status={statusProp} />
                        </div>
                        <div
                          className="font-mono text-[13px] font-semibold"
                          style={{
                            color:
                              g.score != null && g.score >= 8
                                ? "#1A5C2A"
                                : g.score != null && g.score >= 6
                                  ? "#7A5C10"
                                  : g.score != null
                                    ? "#8B2020"
                                    : "#B0AFA9",
                          }}
                        >
                          {g.score != null ? `${g.score}/10` : "—"}
                        </div>
                        <div>
                          {g.campagne_id ? (
                            <Link
                              href={`/campagnes/${g.campagne_id}#gesprek-${g.id}`}
                              className="inline-block whitespace-nowrap rounded-[5px] border border-black/[0.08] bg-[#F5F4F0] px-2.5 py-1 text-[12px] no-underline"
                              style={{ color: "#8A8A85" }}
                            >
                              Rapport
                            </Link>
                          ) : (
                            "—"
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            <div className="px-[18px] py-3.5">
              <Link
                href={`/campagnes/nieuw?vacature=${vacature.id}`}
                className="block w-full rounded-lg border-none py-3 text-center text-[13px] font-medium no-underline"
                style={{ background: "#1A1A18", color: "#FAFAF8" }}
              >
                + Nieuwe screening campagne starten
              </Link>
            </div>
          </div>
        </div>

        {/* RIGHT — Sidebar */}
        <div className="flex flex-col gap-4">
          <div
            className="overflow-hidden rounded-xl border border-black/[0.07] bg-white"
          >
            <div className="border-b border-black/[0.06] px-[18px] py-3.5">
              <span
                className="text-[10px] font-semibold uppercase tracking-[0.1em]"
                style={{ color: "#B0AFA9" }}
              >
                Vacature info
              </span>
            </div>
            <div
              className="grid grid-cols-2 gap-3.5 px-[18px] py-4"
            >
              {infoGrid.map(([label, val]) => (
                <div key={label}>
                  <div
                    className="mb-0.5 text-[10px] font-semibold uppercase tracking-[0.06em]"
                    style={{ color: "#B0AFA9" }}
                  >
                    {label}
                  </div>
                  <div
                    className="text-[13px] font-medium"
                    style={{ color: "#1A1A18" }}
                  >
                    {val}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div
            className="overflow-hidden rounded-xl border border-black/[0.07] bg-white"
          >
            <div className="border-b border-black/[0.06] px-[18px] py-3.5">
              <span
                className="text-[10px] font-semibold uppercase tracking-[0.1em]"
                style={{ color: "#B0AFA9" }}
              >
                Statistieken
              </span>
            </div>
            {statRows.map(([label, val, green]) => (
              <div
                key={label}
                className="flex items-center justify-between border-b border-black/[0.04] px-[18px] py-2.5 last:border-b-0"
              >
                <span className="text-[13px]" style={{ color: "#8A8A85" }}>
                  {label}
                </span>
                <span
                  className="font-mono text-sm font-semibold"
                  style={{ color: green ? "#1A5C2A" : "#1A1A18" }}
                >
                  {val}
                </span>
              </div>
            ))}
          </div>

          <Link
            href={`/vacatures/${vacature.id}/bewerken`}
            className="block w-full rounded-lg border border-black/[0.13] bg-transparent py-2.5 text-center text-[13px] font-medium no-underline"
            style={{ color: "#1A1A18" }}
          >
            Vacature bewerken
          </Link>
        </div>
      </div>
    </PageWrapper>
  );
}
