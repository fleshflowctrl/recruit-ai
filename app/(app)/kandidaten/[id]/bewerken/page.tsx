import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { KandidaatEditForm } from "./KandidaatEditForm";
import { createClient } from "@/lib/supabase/server";
import { getSessionContext } from "@/lib/auth";

export default async function BewerkKandidaatPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const ctx = await getSessionContext();
  if (!ctx) redirect("/login");
  const { id } = await params;

  const supabase = await createClient();
  const { data: k } = await supabase
    .from("kandidaten")
    .select("*")
    .eq("id", id)
    .eq("bureau_id", ctx.bureau.id)
    .single();

  if (!k) notFound();

  return (
    <PageWrapper>
      <Header
        title="Kandidaat bewerken"
        actions={
          <Link
            href={`/kandidaten/${id}`}
            className="text-sm text-primary hover:underline"
          >
            Annuleren
          </Link>
        }
      />
      <KandidaatEditForm kandidaat={k} />
    </PageWrapper>
  );
}
