import { Header } from "@/components/layout/Header";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { KandidaatForm } from "@/components/kandidaten/KandidaatForm";
import { getSessionContext } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function NieuweKandidaatPage() {
  const ctx = await getSessionContext();
  if (!ctx) redirect("/login");

  return (
    <PageWrapper>
      <Header title="Nieuwe kandidaat" />
      <KandidaatForm bureauId={ctx.bureau.id} />
    </PageWrapper>
  );
}
