import Link from "next/link";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { EmptyState } from "@/components/ui/EmptyState";
import { OpdrachtgeverSearch } from "@/components/opdrachtgevers/OpdrachtgeverSearch";
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

  const { data: vacatureCounts } = await supabase
    .from("vacatures")
    .select("opdrachtgever_id")
    .eq("bureau_id", ctx.bureau.id)
    .eq("status", "open");

  const countByOpdrachtgever: Record<string, number> = {};
  for (const v of vacatureCounts ?? []) {
    if (!v.opdrachtgever_id) continue;
    countByOpdrachtgever[v.opdrachtgever_id] =
      (countByOpdrachtgever[v.opdrachtgever_id] ?? 0) + 1;
  }

  return (
    <PageWrapper className="space-y-5 p-4 md:p-6 lg:p-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="min-w-0 flex-1">
          <h1 className="text-[24px] font-medium tracking-[-0.3px] text-[#1A1A18]">
            Opdrachtgevers
            <em className="font-[inherit] not-italic text-[#B0AFA9]">
              {" "}
              · {rows?.length ?? 0}
            </em>
          </h1>
          <p className="mt-[3px] text-[13px] text-[#8A8A85]">
            Bedrijven waarvoor u vacatures plaatst
          </p>
        </div>
        <Link
          href="/opdrachtgevers/nieuw"
          className="btn-primary shrink-0 self-center"
        >
          + Toevoegen
        </Link>
      </div>

      {!rows?.length ? (
        <EmptyState
          title="Nog geen opdrachtgevers."
          description="Voeg uw eerste opdrachtgever toe."
          action={
            <Link href="/opdrachtgevers/nieuw" className="btn-primary">
              Toevoegen
            </Link>
          }
        />
      ) : (
        <OpdrachtgeverSearch
          opdrachtgevers={rows}
          vacatureCounts={countByOpdrachtgever}
        />
      )}
    </PageWrapper>
  );
}
