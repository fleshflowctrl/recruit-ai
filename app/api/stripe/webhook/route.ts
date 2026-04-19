import { createAdminClient } from "@/lib/supabase/admin";
import { getStripe } from "@/lib/stripe";
import { planEnCreditsVoorPriceId } from "@/lib/stripePlans";
import { NextResponse } from "next/server";
import type Stripe from "stripe";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "Webhook niet geconfigureerd" }, { status: 500 });
  }

  const body = await request.text();
  const sig = request.headers.get("stripe-signature");
  if (!sig) {
    return NextResponse.json({ error: "Geen signature" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(body, sig, secret);
  } catch {
    return NextResponse.json({ error: "Ongeldige signature" }, { status: 400 });
  }

  const admin = createAdminClient();
  const stripe = getStripe();

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const bureauId =
        session.client_reference_id ??
        session.metadata?.bureau_id ??
        null;

      if (bureauId && session.subscription) {
        const sub = await stripe.subscriptions.retrieve(
          String(session.subscription),
          { expand: ["items.data.price"] },
        );
        const priceId = sub.items.data[0]?.price?.id;
        const mapped = planEnCreditsVoorPriceId(priceId);
        const updates: Record<string, unknown> = {
          stripe_customer_id: String(session.customer ?? ""),
          stripe_subscription_id: sub.id,
        };
        if (mapped) {
          updates.plan = mapped.plan;
          updates.credits_resterend = mapped.credits;
        } else {
          updates.plan = "professional";
        }
        await admin.from("bureaus").update(updates).eq("id", bureauId);
      }
      break;
    }
    case "customer.subscription.updated":
    case "customer.subscription.created": {
      const sub = event.data.object as Stripe.Subscription;
      const customerId = String(sub.customer);
      const priceId = sub.items.data[0]?.price?.id;
      const mapped = planEnCreditsVoorPriceId(priceId);

      const { data: bureau } = await admin
        .from("bureaus")
        .select("id")
        .eq("stripe_customer_id", customerId)
        .maybeSingle();

      if (bureau) {
        const updates: Record<string, unknown> = {
          stripe_subscription_id: sub.id,
        };
        if (mapped) {
          updates.plan = mapped.plan;
          if (sub.status === "active") {
            updates.credits_resterend = mapped.credits;
          }
        }
        await admin.from("bureaus").update(updates).eq("id", bureau.id);
      }
      break;
    }
    case "customer.subscription.deleted": {
      const sub = event.data.object as Stripe.Subscription;
      const customerId = String(sub.customer);
      const { data: bureau } = await admin
        .from("bureaus")
        .select("id")
        .eq("stripe_customer_id", customerId)
        .maybeSingle();
      if (bureau) {
        await admin
          .from("bureaus")
          .update({
            stripe_subscription_id: null,
            plan: "trial",
            credits_resterend: 50,
          })
          .eq("id", bureau.id);
      }
      break;
    }
    default:
      break;
  }

  return NextResponse.json({ received: true });
}
