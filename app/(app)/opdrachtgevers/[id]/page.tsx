import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { OpdrachtgeverForm } from "../OpdrachtgeverForm";
import { createClient } from "@/lib/supabase/server";
import { getSessionContext } from "@/lib/auth";

export default async function OpdrachtgeverDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const ctx = await getSessionContext();
  if (!ctx) redirect("/login");
  const { id } = await params;

  const supabase = await createClient();
  const { data: o } = await supabase
    .from("opdrachtgevers")
    .select("*")
    .eq("id", id)
    .eq("bureau_id", ctx.bureau.id)
    .single();

  if (!o) notFound();

  return (
    <PageWrapper>
      <Header
        title={o.naam}
        actions={
          <Link href="/opdrachtgevers" className="text-sm text-primary hover:underline">
            Terug naar lijst
          </Link>
        }
      />
      <OpdrachtgeverForm
        bureauId={ctx.bureau.id}
        initial={{ ...o, id: o.id } as Record<string, string | null>}
      />
    </PageWrapper>
  );
}
