import { PageWrapper } from "@/components/layout/PageWrapper";
import { EmptyState } from "@/components/ui/EmptyState";
import { PlaatsingenClient } from "@/components/plaatsingen/PlaatsingenClient";
import { createClient } from "@/lib/supabase/server";
import { getSessionContext } from "@/lib/auth";
import { redirect } from "next/navigation";

function StatBlock({
  label,
  value,
  green,
}: {
  label: string;
  value: string | number;
  green?: boolean;
}) {
  return (
    <div
      className="rounded-[10px] border border-[rgba(0,0,0,0.06)] bg-[#F5F4F0] px-4 py-3.5"
    >
      <p
        className="font-mono text-[22px] font-medium"
        style={{ color: green ? "#1A5C2A" : "#1A1A18" }}
      >
        {value}
      </p>
      <p className="mt-1 text-[11px] text-[#8A8A85]">{label}</p>
    </div>
  );
}

export default async function PlaatsingenPage() {
  const ctx = await getSessionContext();
  if (!ctx) redirect("/login");
  const supabase = await createClient();
  const { data: rows } = await supabase
    .from("plaatsingen")
    .select("*")
    .eq("bureau_id", ctx.bureau.id)
    .order("aangemaakt_op", { ascending: false });

  const kIds = [...new Set((rows ?? []).map((r) => r.kandidaat_id).filter(Boolean))] as string[];
  const vIds = [...new Set((rows ?? []).map((r) => r.vacature_id).filter(Boolean))] as string[];
  const oIds = [...new Set((rows ?? []).map((r) => r.opdrachtgever_id).filter(Boolean))] as string[];
  const kn: Record<string, string> = {};
  const vn: Record<string, string> = {};
  const on: Record<string, string> = {};
  if (kIds.length) {
    const { data } = await supabase.from("kandidaten").select("id, naam").in("id", kIds);
    for (const k of data ?? []) kn[k.id] = k.naam;
  }
  if (vIds.length) {
    const { data } = await supabase.from("vacatures").select("id, titel").in("id", vIds);
    for (const v of data ?? []) vn[v.id] = v.titel;
  }
  if (oIds.length) {
    const { data } = await supabase.from("opdrachtgevers").select("id, naam").in("id", oIds);
    for (const o of data ?? []) on[o.id] = o.naam;
  }

  const mapped =
    rows?.map((p) => ({
      id: p.id,
      kandidaatId: p.kandidaat_id ?? "",
      kandidaatNaam: p.kandidaat_id ? kn[p.kandidaat_id] ?? "—" : "—",
      opdrachtgeverNaam: p.opdrachtgever_id ? on[p.opdrachtgever_id] ?? "—" : "—",
      vacatureTitel: p.vacature_id ? vn[p.vacature_id] ?? "—" : "—",
      startdatum: p.startdatum,
      einddatum: p.einddatum,
      status: p.status,
      uurtariefKandidaat:
        p.uurtarief_kandidaat != null ? String(p.uurtarief_kandidaat) : null,
      uurtariefOpdrachtgever:
        p.uurtarief_opdrachtgever != null ? String(p.uurtarief_opdrachtgever) : null,
    })) ?? [];

  const actief = mapped.filter((p) => p.status === "actief").length;

  const gemMargePerUur = (() => {
    const withBoth = mapped.filter(
      (p) => p.uurtariefKandidaat && p.uurtariefOpdrachtgever
    );
    if (!withBoth.length) return null;
    const avg =
      withBoth.reduce((sum, p) => {
        return (
          sum +
          (parseFloat(p.uurtariefOpdrachtgever!) -
            parseFloat(p.uurtariefKandidaat!))
        );
      }, 0) / withBoth.length;
    return avg.toFixed(2);
  })();

  const gemTariefKlant = (() => {
    const withTarief = mapped.filter((p) => p.uurtariefOpdrachtgever);
    if (!withTarief.length) return null;
    const avg =
      withTarief.reduce(
        (sum, p) => sum + parseFloat(p.uurtariefOpdrachtgever!),
        0
      ) / withTarief.length;
    return avg.toFixed(2);
  })();

  const totaalDagenActief = mapped
    .filter((p) => p.status === "actief" && p.startdatum)
    .reduce((sum, p) => {
      const start = new Date(p.startdatum!);
      const now = new Date();
      const days = Math.max(
        0,
        Math.floor(
          (now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)
        )
      );
      return sum + days;
    }, 0);

  return (
    <PageWrapper className="space-y-5">
      <div>
        <h1
          className="text-2xl font-medium tracking-tight"
          style={{ letterSpacing: "-0.3px", fontSize: "24px" }}
        >
          Plaatsingen{" "}
          <em className="font-normal not-italic text-[#B0AFA9]">
            · {mapped.length}
          </em>
        </h1>
        <p className="mt-[3px] text-[13px] text-[#8A8A85]">
          Actieve en afgeronde plaatsingen
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatBlock label="actief" value={actief} green />
        <StatBlock
          label="gem. tarief klant"
          value={gemTariefKlant ? `€${gemTariefKlant}` : "—"}
        />
        <StatBlock
          label="gem. marge/uur"
          value={gemMargePerUur ? `€${gemMargePerUur}` : "—"}
          green
        />
        <StatBlock label="dagen actief totaal" value={totaalDagenActief} />
      </div>

      {!mapped.length ? (
        <EmptyState
          title="Nog geen plaatsingen."
          description="Bevestig uw eerste plaatsing vanuit een campagne."
        />
      ) : (
        <PlaatsingenClient rows={mapped} bureauId={ctx.bureau.id} />
      )}
    </PageWrapper>
  );
}
