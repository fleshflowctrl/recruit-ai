import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { VacatureForm } from "../VacatureForm";
import { createClient } from "@/lib/supabase/server";
import { getSessionContext } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function NieuweVacaturePage() {
  const ctx = await getSessionContext();
  if (!ctx) redirect("/login");
  const supabase = await createClient();
  const { data: opdrachtgevers } = await supabase
    .from("opdrachtgevers")
    .select("id, naam")
    .eq("bureau_id", ctx.bureau.id)
    .order("naam");

  return (
    <PageWrapper>
      <Header
        title="Nieuwe vacature"
        actions={
          <Link href="/vacatures" className="text-sm text-primary hover:underline">
            Terug
          </Link>
        }
      />
      <VacatureForm
        bureauId={ctx.bureau.id}
        opdrachtgevers={opdrachtgevers ?? []}
      />
    </PageWrapper>
  );
}
