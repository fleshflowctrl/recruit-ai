import Link from "next/link";
import { Suspense } from "react";
import { Header } from "@/components/layout/Header";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { DataTable, Th, Td } from "@/components/ui/DataTable";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { createClient } from "@/lib/supabase/server";
import { getSessionContext } from "@/lib/auth";
import { redirect } from "next/navigation";
import { formatPhoneNl, timeAgoNl } from "@/lib/utils";
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
    <PageWrapper>
      <Header
        title="Kandidaten"
        actions={
          <>
            <Link
              href="/kandidaten/nieuw"
              className="rounded-xl bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              + Toevoegen
            </Link>
            <Link
              href="/kandidaten/import"
              className="rounded-xl border border-border px-4 py-2 text-sm font-medium hover:bg-slate-50"
            >
              Importeer CSV
            </Link>
          </>
        }
      />

      <Suspense fallback={<LoadingSpinner />}>
        <KandidatenFilters />
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
            <Link
              href="/kandidaten/nieuw"
              className="rounded-xl bg-primary px-4 py-2 text-sm font-medium text-white"
            >
              Kandidaat toevoegen
            </Link>
          }
        />
      ) : (
        <>
          <div className="overflow-x-auto">
          <DataTable>
            <thead>
              <tr>
                <Th>Naam</Th>
                <Th>Telefoon</Th>
                <Th>Status</Th>
                <Th>Beschikbaar per</Th>
                <Th>Sector(en)</Th>
                <Th>Laatste contact</Th>
                <Th>Score gem.</Th>
                <Th>Acties</Th>
              </tr>
            </thead>
            <tbody>
              {rows.map((k) => {
                const arr = avgByKandidaat[k.id];
                const avg =
                  arr?.length ?
                    Math.round(
                      arr.reduce((a, b) => a + b, 0) / arr.length,
                    )
                  : null;
                return (
                  <tr key={k.id}>
                    <Td>
                      <Link
                        href={`/kandidaten/${k.id}`}
                        className="font-medium text-primary hover:underline"
                      >
                        {k.naam}
                      </Link>
                    </Td>
                    <Td>{formatPhoneNl(k.telefoon)}</Td>
                    <Td>
                      <StatusBadge status={k.status} />
                    </Td>
                    <Td>{k.beschikbaar_per ?? "—"}</Td>
                    <Td>{(k.sectoren ?? []).join(", ") || "—"}</Td>
                    <Td>{timeAgoNl(k.laatste_contact)}</Td>
                    <Td>{avg != null ? `${avg}/10` : "—"}</Td>
                    <Td>
                      <div className="flex flex-wrap gap-2 text-sm">
                        <Link
                          href={`/kandidaten/${k.id}`}
                          className="text-primary hover:underline"
                        >
                          Bekijken
                        </Link>
                        <span className="text-border">|</span>
                        <Link
                          href={`/kandidaten/${k.id}?bel=1`}
                          className="text-accent hover:underline"
                        >
                          Bellen
                        </Link>
                        <span className="text-border">|</span>
                        <Link
                          href={`/kandidaten/${k.id}?whatsapp=1`}
                          className="text-slate-600 hover:underline"
                        >
                          WhatsApp
                        </Link>
                      </div>
                    </Td>
                  </tr>
                );
              })}
            </tbody>
          </DataTable>
          </div>
          <div className="mt-4 flex items-center justify-between text-sm text-muted">
            <span>
              Pagina {page} van {pages} ({count ?? 0} totaal)
            </span>
            <div className="flex gap-2">
              {page > 1 && (
                <Link
                  href={`/kandidaten?${base}${base ? "&" : ""}page=${page - 1}`}
                  className="rounded-lg border border-border px-3 py-1 hover:bg-slate-50"
                >
                  Vorige
                </Link>
              )}
              {page < pages && (
                <Link
                  href={`/kandidaten?${base}${base ? "&" : ""}page=${page + 1}`}
                  className="rounded-lg border border-border px-3 py-1 hover:bg-slate-50"
                >
                  Volgende
                </Link>
              )}
            </div>
          </div>
        </>
      )}
    </PageWrapper>
  );
}
