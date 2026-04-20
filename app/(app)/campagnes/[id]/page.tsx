import { notFound, redirect } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { VoortgangsBalk } from "@/components/campagnes/VoortgangsBalk";
import { CampagneActions } from "./CampagneActions";
import { ExportGeschiktenButton } from "./ExportGeschiktenButton";
import { createClient } from "@/lib/supabase/server";
import { getSessionContext } from "@/lib/auth";
import { CampagneRefresh } from "./CampagneRefresh";
import type {
  Gesprek,
  Kandidaat,
  CampagneKandidaat,
  PlaatsingPrefill,
} from "@/lib/types";
import { CampagneKandidatenTable } from "@/components/campagnes/CampagneKandidatenTable";
import { format } from "date-fns";

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

  const sorted = [...(gesprekken ?? [])].sort(
    (a, b) =>
      new Date(b.aangemaakt_op).getTime() -
      new Date(a.aangemaakt_op).getTime(),
  );
  const gMap: Record<string, Gesprek> = {};
  for (const g of sorted) {
    if (g.kandidaat_id && !gMap[g.kandidaat_id]) {
      gMap[g.kandidaat_id] = g as Gesprek;
    }
  }

  const tableRows = (ckRows ?? []).map((r) => {
    const k = r.kandidaten as Kandidaat;
    const ck = r as CampagneKandidaat & { kandidaten: Kandidaat };
    return {
      campagneKandidaat: {
        id: ck.id,
        campagne_id: ck.campagne_id,
        kandidaat_id: ck.kandidaat_id,
        status: ck.status,
        bel_pogingen: ck.bel_pogingen,
        volgende_bel_poging: ck.volgende_bel_poging,
        aangemaakt_op: ck.aangemaakt_op,
      },
      kandidaat: k,
      gesprek: gMap[k.id] ?? null,
    };
  });

  const totaal = c.totaal_kandidaten ?? 0;
  const gebeld = c.gebeld ?? 0;
  const pct = totaal > 0 ? Math.round((gebeld / totaal) * 100) : 0;

  let plaatsingPrefill: PlaatsingPrefill | null = null;
  if (c.vacature_id) {
    const { data: vacature } = await supabase
      .from("vacatures")
      .select("*")
      .eq("id", c.vacature_id)
      .eq("bureau_id", ctx.bureau.id)
      .single();
    if (vacature?.opdrachtgever_id) {
      const { data: og } = await supabase
        .from("opdrachtgevers")
        .select("*")
        .eq("id", vacature.opdrachtgever_id)
        .eq("bureau_id", ctx.bureau.id)
        .single();
      if (vacature && og) {
        plaatsingPrefill = {
          vacatureId: vacature.id,
          opdrachtgeverId: og.id,
          einddatum: vacature.einddatum,
          startdatumDefault:
            vacature.startdatum ??
            format(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), "yyyy-MM-dd"),
          adres: og.adres ?? vacature.locatie ?? "",
          contactpersoon: og.contactpersoon ?? "",
          contactTelefoon: og.telefoon ?? "",
          functieTitel: vacature.titel,
          bedrijfNaam: og.naam,
        };
      }
    }
  }

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
        <div className="panel-cream p-6 text-center shadow-none">
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
      <div className="panel-cream mb-6 p-4 text-sm shadow-none">
        <strong>Geen gehoor:</strong> {c.geen_gehoor ?? 0}
      </div>

      <CampagneKandidatenTable
        campagneId={c.id}
        rows={tableRows}
        plaatsingPrefill={plaatsingPrefill}
      />
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
    <div className="panel-cream p-6 shadow-none">
      <p className="text-sm text-muted">
        {emoji} {label}
      </p>
      <p className="mt-1 text-2xl font-semibold">{value}</p>
    </div>
  );
}
