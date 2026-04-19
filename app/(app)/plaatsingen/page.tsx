import { Header } from "@/components/layout/Header";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { EmptyState } from "@/components/ui/EmptyState";
import { PlaatsingenTable } from "@/components/plaatsingen/PlaatsingenTable";
import { createClient } from "@/lib/supabase/server";
import { getSessionContext } from "@/lib/auth";
import { redirect } from "next/navigation";

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

  return (
    <PageWrapper>
      <Header title="Plaatsingen" />
      {!mapped.length ? (
        <EmptyState
          title="Nog geen plaatsingen. Bevestig uw eerste plaatsing vanuit een campagne."
          description="Na een geschikt gesprek kunt u een plaatsing bevestigen en WhatsApp sturen."
        />
      ) : (
        <PlaatsingenTable rows={mapped} bureauId={ctx.bureau.id} />
      )}
    </PageWrapper>
  );
}
