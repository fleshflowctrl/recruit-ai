import { createClient } from "@/lib/supabase/server";
import { createCheckoutSession } from "@/lib/stripe";
import { NextResponse } from "next/server";
import { z } from "zod";

const schema = z.object({
  priceId: z.string().min(1),
});

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Niet geautoriseerd" }, { status: 401 });
  }

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: "Ongeldige JSON" }, { status: 400 });
  }

  const parsed = schema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("bureau_id")
    .eq("id", user.id)
    .single();
  if (!profile) {
    return NextResponse.json({ error: "Geen profiel" }, { status: 403 });
  }

  const { data: bureau } = await supabase
    .from("bureaus")
    .select("stripe_customer_id")
    .eq("id", profile.bureau_id)
    .single();

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  try {
    const session = await createCheckoutSession({
      priceId: parsed.data.priceId,
      customerId: bureau?.stripe_customer_id ?? null,
      bureauId: profile.bureau_id,
      successUrl: `${appUrl}/instellingen?checkout=success`,
      cancelUrl: `${appUrl}/instellingen?checkout=cancel`,
    });
    if (!session.url) {
      return NextResponse.json({ error: "Geen checkout-URL" }, { status: 500 });
    }
    return NextResponse.json({ url: session.url });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Checkout mislukt";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
