import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { BulkImport } from "@/components/kandidaten/BulkImport";
import { getSessionContext } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function ImportKandidatenPage() {
  const ctx = await getSessionContext();
  if (!ctx) redirect("/login");

  return (
    <PageWrapper>
      <Header
        title="CSV-import"
        actions={
          <Link href="/kandidaten" className="text-sm text-primary hover:underline">
            Terug naar kandidaten
          </Link>
        }
      />
      <BulkImport bureauId={ctx.bureau.id} />
    </PageWrapper>
  );
}
