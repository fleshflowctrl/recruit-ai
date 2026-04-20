import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { DataTable, Th, Td } from "@/components/ui/DataTable";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import { createClient } from "@/lib/supabase/server";
import { getSessionContext } from "@/lib/auth";
import { redirect } from "next/navigation";
import { format } from "date-fns";
import { nl } from "date-fns/locale";
import { CampagneActies } from "./CampagneActies";

export default async function CampagnesPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const ctx = await getSessionContext();
  if (!ctx) redirect("/login");
  const { tab } = await searchParams;

  const supabase = await createClient();
  let q = supabase
    .from("campagnes")
    .select("*")
    .eq("bureau_id", ctx.bureau.id)
    .order("aangemaakt_op", { ascending: false });

  if (tab === "actief") q = q.eq("status", "actief");
  if (tab === "concept") q = q.eq("status", "concept");
  if (tab === "afgerond") q = q.eq("status", "afgerond");

  const { data: rows } = await q;

  const vacIds = [...new Set((rows ?? []).map((r) => r.vacature_id).filter(Boolean))] as string[];
  const titels: Record<string, string> = {};
  if (vacIds.length) {
    const { data: vacs } = await supabase
      .from("vacatures")
      .select("id, titel")
      .in("id", vacIds);
    for (const v of vacs ?? []) titels[v.id] = v.titel;
  }

  return (
    <PageWrapper>
      <Header
        title="Campagnes"
        actions={
          <Link href="/campagnes/nieuw" className="btn-cream-primary">
            Nieuwe campagne
          </Link>
        }
      />

      <div className="mb-6 flex flex-wrap gap-2 text-sm">
        <Tab href="/campagnes" active={!tab}>
          Alle
        </Tab>
        <Tab href="/campagnes?tab=actief" active={tab === "actief"}>
          Actief
        </Tab>
        <Tab href="/campagnes?tab=concept" active={tab === "concept"}>
          Concept
        </Tab>
        <Tab href="/campagnes?tab=afgerond" active={tab === "afgerond"}>
          Afgerond
        </Tab>
      </div>

      {!rows?.length ? (
        <EmptyState
          title="Nog geen campagnes. Start uw eerste screening."
          description="Koppel een vacature en selecteer kandidaten om te bellen."
          action={
            <Link href="/campagnes/nieuw" className="btn-cream-primary">
              Nieuwe campagne
            </Link>
          }
        />
      ) : (
        <div className="overflow-x-auto">
        <DataTable>
          <thead>
            <tr>
              <Th>Naam</Th>
              <Th>Type</Th>
              <Th>Vacature</Th>
              <Th>Kandidaten</Th>
              <Th>✅ / ⚠️ / ❌</Th>
              <Th>Status</Th>
              <Th>Datum</Th>
              <Th>Acties</Th>
            </tr>
          </thead>
          <tbody>
            {rows.map((c) => (
              <tr key={c.id}>
                <Td>
                  <Link
                    href={`/campagnes/${c.id}`}
                    className="font-medium text-[color:var(--cream-text)] hover:underline"
                  >
                    {c.naam}
                  </Link>
                </Td>
                <Td className="capitalize">{c.type}</Td>
                <Td>
                  {c.vacature_id ? titels[c.vacature_id] ?? "—" : "—"}
                </Td>
                <Td>
                  {c.gebeld ?? 0}/{c.totaal_kandidaten ?? 0}
                </Td>
                <Td className="text-xs">
                  {c.geschikt ?? 0} / {c.twijfel ?? 0} / {c.niet_geschikt ?? 0}
                </Td>
                <Td>
                  <StatusBadge status={c.status} />
                </Td>
                <Td className="whitespace-nowrap text-muted">
                  {format(new Date(c.aangemaakt_op), "d MMM yyyy", {
                    locale: nl,
                  })}
                </Td>
                <Td>
                  <CampagneActies campagneId={c.id} status={c.status} />
                </Td>
              </tr>
            ))}
          </tbody>
        </DataTable>
        </div>
      )}
    </PageWrapper>
  );
}

function Tab({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={
        active ?
          "rounded-full bg-[color:var(--cream-text)] px-3 py-1 text-[color:var(--cream-bg)] text-xs font-medium"
        : "rounded-full border border-[color:var(--cream-border-md)] bg-transparent px-3 py-1 text-xs font-medium text-[color:var(--cream-muted)] hover:bg-[color:var(--cream-surface)]"
      }
    >
      {children}
    </Link>
  );
}
