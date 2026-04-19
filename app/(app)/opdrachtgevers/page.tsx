import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { DataTable, Th, Td } from "@/components/ui/DataTable";
import { EmptyState } from "@/components/ui/EmptyState";
import { createClient } from "@/lib/supabase/server";
import { getSessionContext } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function OpdrachtgeversPage() {
  const ctx = await getSessionContext();
  if (!ctx) redirect("/login");
  const supabase = await createClient();
  const { data: rows } = await supabase
    .from("opdrachtgevers")
    .select("*")
    .eq("bureau_id", ctx.bureau.id)
    .order("naam");

  return (
    <PageWrapper>
      <Header
        title="Opdrachtgevers"
        actions={
          <Link
            href="/opdrachtgevers/nieuw"
            className="rounded-xl bg-primary px-4 py-2 text-sm font-medium text-white"
          >
            + Toevoegen
          </Link>
        }
      />
      {!rows?.length ? (
        <EmptyState
          title="Geen opdrachtgevers"
          description="Voeg uw eerste opdrachtgever toe."
          action={
            <Link
              href="/opdrachtgevers/nieuw"
              className="rounded-xl bg-primary px-4 py-2 text-sm text-white"
            >
              Opdrachtgever toevoegen
            </Link>
          }
        />
      ) : (
        <DataTable>
          <thead>
            <tr>
              <Th>Naam</Th>
              <Th>Sector</Th>
              <Th>Contact</Th>
              <Th>Telefoon</Th>
            </tr>
          </thead>
          <tbody>
            {rows.map((o) => (
              <tr key={o.id}>
                <Td>
                  <Link
                    href={`/opdrachtgevers/${o.id}`}
                    className="font-medium text-primary hover:underline"
                  >
                    {o.naam}
                  </Link>
                </Td>
                <Td>{o.sector ?? "—"}</Td>
                <Td>{o.contactpersoon ?? "—"}</Td>
                <Td>{o.telefoon ?? "—"}</Td>
              </tr>
            ))}
          </tbody>
        </DataTable>
      )}
    </PageWrapper>
  );
}
