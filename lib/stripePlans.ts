/** Map Stripe price ID → intern plan + credits (checkout webhook). */
export function planEnCreditsVoorPriceId(
  priceId: string | undefined,
): { plan: string; credits: number } | null {
  if (!priceId) return null;
  const starter = process.env.NEXT_PUBLIC_STRIPE_PRICE_STARTER;
  const pro = process.env.NEXT_PUBLIC_STRIPE_PRICE_PROFESSIONAL;
  const ent = process.env.NEXT_PUBLIC_STRIPE_PRICE_ENTERPRISE;
  if (starter && priceId === starter) return { plan: "starter", credits: 100 };
  if (pro && priceId === pro) return { plan: "professional", credits: 300 };
  if (ent && priceId === ent) return { plan: "enterprise", credits: 99999 };
  return null;
}
