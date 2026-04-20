import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { DataTable, Th, Td } from "@/components/ui/DataTable";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import { createClient } from "@/lib/supabase/server";
import { getSessionContext } from "@/lib/auth";
import { redirect } from "next/navigation";
import { formatEuro } from "@/lib/utils";

export default async function VacaturesPage() {
  const ctx = await getSessionContext();
  if (!ctx) redirect("/login");
  const supabase = await createClient();
  const { data: rows } = await supabase
    .from("vacatures")
    .select("*")
    .eq("bureau_id", ctx.bureau.id)
    .order("aangemaakt_op", { ascending: false });

  return (
    <PageWrapper>
      <Header
        title="Vacatures"
        actions={
          <Link href="/vacatures/nieuw" className="btn-cream-primary">
            + Vacature aanmaken
          </Link>
        }
      />
      {!rows?.length ? (
        <EmptyState
          title="Nog geen vacatures. Voeg uw eerste vacature toe."
          description="Vacatures koppelt u aan opdrachtgevers en campagnes."
          action={
            <Link href="/vacatures/nieuw" className="btn-cream-primary">
              Vacature aanmaken
            </Link>
          }
        />
      ) : (
        <div className="overflow-x-auto">
        <DataTable>
          <thead>
            <tr>
              <Th>Titel</Th>
              <Th>Locatie</Th>
              <Th>Salaris</Th>
              <Th>Status</Th>
            </tr>
          </thead>
          <tbody>
            {rows.map((v) => (
              <tr key={v.id}>
                <Td>
                  <Link
                    href={`/vacatures/${v.id}`}
                    className="font-medium text-[color:var(--cream-text)] hover:underline"
                  >
                    {v.titel}
                  </Link>
                </Td>
                <Td>{v.locatie ?? "—"}</Td>
                <Td>{formatEuro(v.salaris_min, v.salaris_max)}</Td>
                <Td>
                  <StatusBadge status={v.status} />
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
