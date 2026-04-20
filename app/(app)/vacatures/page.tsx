import Link from "next/link";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { EmptyState } from "@/components/ui/EmptyState";
import { VacaturesClient } from "@/components/vacatures/VacaturesClient";
import { createClient } from "@/lib/supabase/server";
import { getSessionContext } from "@/lib/auth";
import { redirect } from "next/navigation";
import type { Vacature } from "@/lib/types";

export default async function VacaturesPage() {
  const ctx = await getSessionContext();
  if (!ctx) redirect("/login");
  const supabase = await createClient();
  const { data: rows } = await supabase
    .from("vacatures")
    .select("*")
    .eq("bureau_id", ctx.bureau.id)
    .order("aangemaakt_op", { ascending: false });

  const { data: opdrachtgevers } = await supabase
    .from("opdrachtgevers")
    .select("id, naam")
    .eq("bureau_id", ctx.bureau.id);

  const opdrachtgeverMap: Record<string, string> = {};
  for (const o of opdrachtgevers ?? []) {
    opdrachtgeverMap[o.id] = o.naam;
  }

  return (
    <PageWrapper className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1
            style={{
              fontSize: 24,
              fontWeight: 500,
              letterSpacing: "-0.3px",
            }}
          >
            Vacatures
            <em
              className="not-italic"
              style={{ color: "#B0AFA9" }}
            >
              {" "}
              · {rows?.length ?? 0}
            </em>
          </h1>
          <p
            className="mt-0.5 text-[13px]"
            style={{ color: "#8A8A85" }}
          >
            Openstaande en gesloten functies
          </p>
        </div>
        <Link href="/vacatures/nieuw" className="btn-primary">
          + Vacature aanmaken
        </Link>
      </div>

      {!rows?.length ? (
        <EmptyState
          title="Nog geen vacatures."
          description="Voeg uw eerste vacature toe en koppel deze aan een opdrachtgever."
          action={
            <Link href="/vacatures/nieuw" className="btn-primary">
              Vacature aanmaken
            </Link>
          }
        />
      ) : (
        <VacaturesClient
          vacatures={rows as Vacature[]}
          opdrachtgevers={opdrachtgeverMap}
        />
      )}
    </PageWrapper>
  );
}
