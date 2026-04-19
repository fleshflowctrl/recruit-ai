import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { OpdrachtgeverForm } from "../OpdrachtgeverForm";
import { getSessionContext } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function NieuweOpdrachtgeverPage() {
  const ctx = await getSessionContext();
  if (!ctx) redirect("/login");

  return (
    <PageWrapper>
      <Header
        title="Nieuwe opdrachtgever"
        actions={
          <Link href="/opdrachtgevers" className="text-sm text-primary hover:underline">
            Terug
          </Link>
        }
      />
      <OpdrachtgeverForm bureauId={ctx.bureau.id} />
    </PageWrapper>
  );
}
