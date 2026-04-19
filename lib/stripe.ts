import Stripe from "stripe";

let stripeSingleton: Stripe | null = null;

export function getStripe(): Stripe {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error("STRIPE_SECRET_KEY ontbreekt");
  }
  if (!stripeSingleton) {
    stripeSingleton = new Stripe(process.env.STRIPE_SECRET_KEY, {
      typescript: true,
    });
  }
  return stripeSingleton;
}

export async function createCheckoutSession(opts: {
  priceId: string;
  customerId?: string | null;
  bureauId: string;
  successUrl: string;
  cancelUrl: string;
  mode?: "subscription" | "payment";
}) {
  const stripe = getStripe();
  const session = await stripe.checkout.sessions.create({
    mode: opts.mode ?? "subscription",
    line_items: [{ price: opts.priceId, quantity: 1 }],
    success_url: opts.successUrl,
    cancel_url: opts.cancelUrl,
    client_reference_id: opts.bureauId,
    ...(opts.customerId ? { customer: opts.customerId } : {}),
  });
  return session;
}
