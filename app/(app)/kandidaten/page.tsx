import Link from "next/link";
import { Suspense } from "react";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { EmptyState } from "@/components/ui/EmptyState";
import { KandidaatKaart } from "@/components/kandidaten/KandidaatKaart";
import { createClient } from "@/lib/supabase/server";
import { getSessionContext } from "@/lib/auth";
import { redirect } from "next/navigation";
import { KandidatenFilters } from "./KandidatenFilters";

const PAGE_SIZE = 25;

export default async function KandidatenPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const ctx = await getSessionContext();
  if (!ctx) redirect("/login");

  const sp = await searchParams;
  const page = Math.max(1, parseInt(sp.page ?? "1", 10) || 1);
  const q = sp.q ?? "";
  const status = sp.status ?? "";
  const rijbewijs = sp.rijbewijs ?? "";

  const supabase = await createClient();
  let query = supabase
    .from("kandidaten")
    .select("*", { count: "exact" })
    .eq("bureau_id", ctx.bureau.id)
    .order("aangemaakt_op", { ascending: false });

  if (q) {
    query = query.or(`naam.ilike.%${q}%,telefoon.ilike.%${q}%`);
  }
  if (status) {
    query = query.eq("status", status);
  }
  if (rijbewijs === "ja") {
    query = query.eq("rijbewijs", true);
  }
  if (rijbewijs === "nee") {
    query = query.eq("rijbewijs", false);
  }

  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;
  const { data: rows, count } = await query.range(from, to);

  const { data: scores } = await supabase
    .from("gesprekken")
    .select("kandidaat_id, score")
    .eq("bureau_id", ctx.bureau.id)
    .not("score", "is", null);

  const [
    { count: countActief },
    { count: countGeplaatst },
    { count: countInactief },
  ] = await Promise.all([
    supabase
      .from("kandidaten")
      .select("*", { count: "exact", head: true })
      .eq("bureau_id", ctx.bureau.id)
      .eq("status", "actief"),
    supabase
      .from("kandidaten")
      .select("*", { count: "exact", head: true })
      .eq("bureau_id", ctx.bureau.id)
      .eq("status", "geplaatst"),
    supabase
      .from("kandidaten")
      .select("*", { count: "exact", head: true })
      .eq("bureau_id", ctx.bureau.id)
      .eq("status", "inactief"),
  ]);

  const avgByKandidaat: Record<string, number[]> = {};
  for (const g of scores ?? []) {
    if (!g.kandidaat_id || g.score == null) continue;
    if (!avgByKandidaat[g.kandidaat_id]) avgByKandidaat[g.kandidaat_id] = [];
    avgByKandidaat[g.kandidaat_id].push(g.score);
  }

  const pages = Math.max(1, Math.ceil((count ?? 0) / PAGE_SIZE));
  const qs = new URLSearchParams();
  if (q) qs.set("q", q);
  if (status) qs.set("status", status);
  if (rijbewijs) qs.set("rijbewijs", rijbewijs);
  const base = qs.toString();
  const hasFilters = Boolean(q || status || rijbewijs);

  return (
    <PageWrapper className="space-y-5">
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:flex-wrap">
        <div>
          <h1 className="text-[26px] font-medium text-[#1A1A18]">
            Kandidaten
            <em className="font-[inherit] not-italic text-[#B0AFA9]">
              {" "}
              · {count ?? 0}
            </em>
          </h1>
          <p className="mt-1 text-[13px] text-[#8A8A85]">
            {countActief ?? 0} actief · {countGeplaatst ?? 0} geplaatst ·{" "}
            {countInactief ?? 0} inactief
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          <Link href="/kandidaten/import" className="btn-secondary">
            Importeer CSV
          </Link>
          <Link href="/kandidaten/nieuw" className="btn-primary">
            + Toevoegen
          </Link>
        </div>
      </div>

      <Suspense fallback={<div className="text-[13px] text-[#8A8A85]">Laden…</div>}>
        <KandidatenFilters
          counts={{
            alle: count ?? 0,
            actief: countActief ?? 0,
            geplaatst: countGeplaatst ?? 0,
            inactief: countInactief ?? 0,
          }}
        />
      </Suspense>

      {!rows?.length ? (
        <EmptyState
          title={
            hasFilters ?
              "Geen kandidaten gevonden"
            : "Nog geen kandidaten. Voeg uw eerste kandidaat toe."
          }
          description={
            hasFilters ?
              "Pas de filters aan of voeg een kandidaat toe."
            : "Voeg handmatig toe of importeer een CSV."
          }
          action={
            <Link href="/kandidaten/nieuw" className="btn-cream-primary">
              Kandidaat toevoegen
            </Link>
          }
        />
      ) : (
        <>
          <div
            className="grid gap-3"
            style={{
              gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
            }}
          >
            {rows.map((k) => {
              const arr = avgByKandidaat[k.id];
              const avg =
                arr?.length ?
                  Math.round(arr.reduce((a, b) => a + b, 0) / arr.length)
                : null;
              return (
                <KandidaatKaart
                  key={k.id}
                  kandidaat={k}
                  gemiddeldeScore={avg}
                  href={`/kandidaten/${k.id}`}
                />
              );
            })}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <span className="text-[13px] text-[#8A8A85]">
              Pagina {page} van {pages} · {count ?? 0} kandidaten
            </span>
            <div className="flex gap-2">
              {page > 1 && (
                <Link
                  href={`/kandidaten?${base}${base ? "&" : ""}page=${page - 1}`}
                  className="pbtn"
                >
                  ← Vorige
                </Link>
              )}
              {page < pages && (
                <Link
                  href={`/kandidaten?${base}${base ? "&" : ""}page=${page + 1}`}
                  className="pbtn"
                >
                  Volgende →
                </Link>
              )}
            </div>
          </div>
        </>
      )}
    </PageWrapper>
  );
}
