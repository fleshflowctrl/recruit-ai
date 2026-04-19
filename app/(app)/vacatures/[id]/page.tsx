import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { VacatureForm } from "../VacatureForm";
import { createClient } from "@/lib/supabase/server";
import { getSessionContext } from "@/lib/auth";

export default async function VacatureDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const ctx = await getSessionContext();
  if (!ctx) redirect("/login");
  const { id } = await params;

  const supabase = await createClient();
  const { data: v } = await supabase
    .from("vacatures")
    .select("*")
    .eq("id", id)
    .eq("bureau_id", ctx.bureau.id)
    .single();

  if (!v) notFound();

  const { data: opdrachtgevers } = await supabase
    .from("opdrachtgevers")
    .select("id, naam")
    .eq("bureau_id", ctx.bureau.id)
    .order("naam");

  return (
    <PageWrapper>
      <Header
        title={v.titel}
        actions={
          <Link href="/vacatures" className="text-sm text-primary hover:underline">
            Terug naar vacatures
          </Link>
        }
      />
      <VacatureForm
        bureauId={ctx.bureau.id}
        opdrachtgevers={opdrachtgevers ?? []}
        initial={v}
      />
    </PageWrapper>
  );
}
