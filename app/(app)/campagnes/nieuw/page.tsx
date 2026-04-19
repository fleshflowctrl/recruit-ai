import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { CampagneWizard } from "@/components/campagnes/CampagneWizard";
import { createClient } from "@/lib/supabase/server";
import { getSessionContext } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function NieuweCampagnePage() {
  const ctx = await getSessionContext();
  if (!ctx) redirect("/login");
  const supabase = await createClient();
  const [{ data: vacatures }, { data: kandidaten }] = await Promise.all([
    supabase
      .from("vacatures")
      .select("id, titel")
      .eq("bureau_id", ctx.bureau.id)
      .order("titel"),
    supabase
      .from("kandidaten")
      .select("id, naam, telefoon")
      .eq("bureau_id", ctx.bureau.id)
      .order("naam"),
  ]);

  return (
    <PageWrapper>
      <Header
        title="Nieuwe campagne"
        actions={
          <Link href="/campagnes" className="text-sm text-primary hover:underline">
            Terug
          </Link>
        }
      />
      <CampagneWizard
        bureauId={ctx.bureau.id}
        vacatures={vacatures ?? []}
        kandidaten={kandidaten ?? []}
      />
    </PageWrapper>
  );
}
