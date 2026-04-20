import {
  InstellingenClient,
  type InstellingenFactuur,
} from "@/components/instellingen/InstellingenClient";
import { getSessionContext } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

function mapStripeInvoice(row: Record<string, unknown>): InstellingenFactuur {
  return {
    id: String(row.id ?? ""),
    amount:
      typeof row.amount === "number"
        ? row.amount
        : Number(row.amount ?? 0),
    created_at:
      typeof row.created_at === "string" ? row.created_at : "",
    plan:
      typeof row.plan === "string"
        ? row.plan
        : typeof row.description === "string"
          ? row.description
          : "—",
    invoice_url:
      typeof row.invoice_url === "string" ? row.invoice_url : null,
  };
}

export default async function InstellingenPage() {
  const ctx = await getSessionContext();
  if (!ctx) redirect("/login");

  const supabase = await createClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select("volledige_naam, rol")
    .eq("id", ctx.userId)
    .maybeSingle();

  const { data: teamleden } = await supabase
    .from("profiles")
    .select("id, volledige_naam, rol")
    .eq("bureau_id", ctx.bureau.id);

  let facturen: InstellingenFactuur[] = [];
  try {
    const { data, error } = await supabase
      .from("stripe_invoices")
      .select("*")
      .eq("bureau_id", ctx.bureau.id)
      .order("created_at", { ascending: false })
      .limit(10);
    if (!error && data) {
      facturen = data
        .map((row) =>
          mapStripeInvoice(
            row as unknown as Record<string, unknown>,
          ),
        )
        .filter((f) => f.id.length > 0);
    }
  } catch {
    facturen = [];
  }

  const telnyxDisplay = "+31 85 083 5335";

  return (
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
      profile={
        profile
          ? {
              volledige_naam: profile.volledige_naam,
              rol: profile.rol,
            }
          : null
      }
      teamleden={teamleden ?? []}
      facturen={facturen}
      userId={ctx.userId}
      telnyxMessagingProfileId={process.env.TELNYX_MESSAGING_PROFILE_ID ?? ""}
    />
  );
}
