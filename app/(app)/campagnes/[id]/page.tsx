import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { ScoreBadge } from "@/components/ui/ScoreBadge";
import { DataTable, Th, Td } from "@/components/ui/DataTable";
import { VoortgangsBalk } from "@/components/campagnes/VoortgangsBalk";
import { CampagneActions } from "./CampagneActions";
import { ExportGeschiktenButton } from "./ExportGeschiktenButton";
import { createClient } from "@/lib/supabase/server";
import { getSessionContext } from "@/lib/auth";
import { CampagneRefresh } from "./CampagneRefresh";
import type { Gesprek } from "@/lib/types";

export default async function CampagneDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const ctx = await getSessionContext();
  if (!ctx) redirect("/login");
  const { id } = await params;

  const supabase = await createClient();
  const { data: c } = await supabase
    .from("campagnes")
    .select("*")
    .eq("id", id)
    .eq("bureau_id", ctx.bureau.id)
    .single();

  if (!c) notFound();

  const { data: ckRows } = await supabase
    .from("campagne_kandidaten")
    .select("*, kandidaten(*)")
    .eq("campagne_id", id);

  const kidIds = (ckRows ?? []).map((r) => r.kandidaat_id);
  let gesprekkenQuery = supabase
    .from("gesprekken")
    .select("*")
    .eq("campagne_id", id);
  if (kidIds.length) {
    gesprekkenQuery = gesprekkenQuery.in("kandidaat_id", kidIds);
  }
  const { data: gesprekken } = await gesprekkenQuery;

  const gMap: Record<string, Gesprek> = {};
  for (const g of gesprekken ?? []) {
    if (g.kandidaat_id) gMap[g.kandidaat_id] = g;
  }

  const totaal = c.totaal_kandidaten ?? 0;
  const gebeld = c.gebeld ?? 0;
  const pct = totaal > 0 ? Math.round((gebeld / totaal) * 100) : 0;

  return (
    <PageWrapper>
      <CampagneRefresh />
      <Header
        title={c.naam}
        subtitle={`Type: ${c.type}`}
        actions={
          <div className="flex flex-col items-end gap-2 sm:flex-row sm:items-center">
            <StatusBadge status={c.status} />
            <CampagneActions campagneId={c.id} />
            <ExportGeschiktenButton
              rows={(ckRows ?? [])
                .filter((r) => r.status === "geschikt")
                .map((r) => {
                  const k = r.kandidaten as { naam?: string; telefoon?: string };
                  return {
                    naam: k?.naam ?? "",
                    telefoon: k?.telefoon ?? "",
                    score: gMap[r.kandidaat_id]?.score,
                  };
                })}
            />
          </div>
        }
      />

      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-border bg-white p-6 text-center shadow-sm">
          <p className="text-3xl font-semibold text-primary">{pct}%</p>
          <p className="text-sm text-muted">Voortgang</p>
          <div className="mt-4">
            <VoortgangsBalk gebeld={gebeld} totaal={totaal} />
          </div>
        </div>
        <StatBox label="Geschikt" value={c.geschikt ?? 0} emoji="✅" />
        <StatBox label="Twijfel" value={c.twijfel ?? 0} emoji="⚠️" />
        <StatBox label="Niet geschikt" value={c.niet_geschikt ?? 0} emoji="❌" />
      </div>
      <div className="mb-6 rounded-2xl border border-border bg-slate-50 p-4 text-sm">
        <strong>Geen gehoor:</strong> {c.geen_gehoor ?? 0}
      </div>

      <DataTable>
        <thead>
          <tr>
            <Th>Naam</Th>
            <Th>Telefoon</Th>
            <Th>Status</Th>
            <Th>Score</Th>
            <Th>Aanbeveling</Th>
            <Th>Duur</Th>
            <Th>Belpogingen</Th>
            <Th>Acties</Th>
          </tr>
        </thead>
        <tbody>
          {(ckRows ?? []).map((r) => {
            const k = r.kandidaten as {
              id: string;
              naam: string;
              telefoon: string;
            };
            const g = gMap[k.id];
            return (
              <tr key={r.id}>
                <Td>{k.naam}</Td>
                <Td>{k.telefoon}</Td>
                <Td>
                  <StatusBadge status={r.status} />
                </Td>
                <Td>
                  <ScoreBadge score={g?.score ?? null} />
                </Td>
                <Td>{g?.aanbeveling ?? "—"}</Td>
                <Td>{g?.duur_seconden ? `${g.duur_seconden}s` : "—"}</Td>
                <Td>{r.bel_pogingen}</Td>
                <Td>
                  <Link
                    href={`/kandidaten/${k.id}`}
                    className="text-primary hover:underline"
                  >
                    Rapport
                  </Link>
                </Td>
              </tr>
            );
          })}
        </tbody>
      </DataTable>
    </PageWrapper>
  );
}

function StatBox({
  label,
  value,
  emoji,
}: {
  label: string;
  value: number;
  emoji: string;
}) {
  return (
    <div className="rounded-2xl border border-border bg-white p-6 shadow-sm">
      <p className="text-sm text-muted">
        {emoji} {label}
      </p>
      <p className="mt-1 text-2xl font-semibold">{value}</p>
    </div>
  );
}
