import { Header } from "@/components/layout/Header";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { InstellingenClient } from "@/components/instellingen/InstellingenClient";
import { getSessionContext } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function InstellingenPage() {
  const ctx = await getSessionContext();
  if (!ctx) redirect("/login");

  const telnyxDisplay = "+31 85 083 5335";

  return (
    <PageWrapper>
      <Header title="Instellingen" />
      <InstellingenClient
        bureau={ctx.bureau}
        telnyxDisplay={telnyxDisplay}
        stripePriceStarter={process.env.NEXT_PUBLIC_STRIPE_PRICE_STARTER ?? ""}
        stripePriceProfessional={
          process.env.NEXT_PUBLIC_STRIPE_PRICE_PROFESSIONAL ?? ""
        }
        stripePriceEnterprise={
          process.env.NEXT_PUBLIC_STRIPE_PRICE_ENTERPRISE ?? ""
        }
      />
    </PageWrapper>
  );
}
