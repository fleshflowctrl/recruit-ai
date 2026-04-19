import { Header } from "@/components/layout/Header";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { STRIPE_PLANS } from "@/lib/constants";
import { getSessionContext } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function InstellingenPage() {
  const ctx = await getSessionContext();
  if (!ctx) redirect("/login");

  const tel = process.env.TELNYX_PHONE_NUMBER ?? "+31850835335";

  return (
    <PageWrapper>
      <Header title="Instellingen" />

      <section className="mb-10 rounded-2xl border border-border bg-white p-6 shadow-sm">
        <h2 className="font-serif text-lg">Bureau profiel</h2>
        <p className="mt-2 text-sm text-muted">
          {ctx.bureau.naam} — {ctx.bureau.email}
        </p>
        <p className="mt-1 text-sm text-muted">
          Wijzigingen via Supabase of toekomstige bewerk-flow.
        </p>
      </section>

      <section className="mb-10 rounded-2xl border border-border bg-white p-6 shadow-sm">
        <h2 className="font-serif text-lg">Telefoonnummer (Telnyx)</h2>
        <p className="mt-2 text-2xl font-medium tabular-nums">{tel}</p>
        <p className="mt-2 text-sm text-success">Status: Actief (configureer in Telnyx)</p>
        <button
          type="button"
          className="mt-4 rounded-xl border border-border px-4 py-2 text-sm font-medium"
          disabled
        >
          Test bel (koppel Telnyx)
        </button>
      </section>

      <section className="rounded-2xl border border-border bg-white p-6 shadow-sm">
        <h2 className="font-serif text-lg">Abonnement (Stripe)</h2>
        <p className="mt-2 text-sm text-muted">
          Huidig plan: <strong>{ctx.bureau.plan}</strong> — credits:{" "}
          {ctx.bureau.credits_resterend}
        </p>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {STRIPE_PLANS.map((p) => (
            <div
              key={p.id}
              className={`rounded-2xl border p-4 ${
                ctx.bureau.plan === p.id ? "border-primary bg-blue-50" : "border-border"
              }`}
            >
              <h3 className="font-semibold">{p.naam}</h3>
              <p className="text-2xl font-bold">€{p.prijs}/maand</p>
              <p className="text-sm text-muted">
                {p.calls ? `${p.calls} calls` : "Onbeperkt"}
              </p>
              <button
                type="button"
                className="mt-3 w-full rounded-xl bg-primary py-2 text-sm text-white disabled:opacity-50"
                disabled
              >
                {ctx.bureau.plan === p.id ? "Huidig plan" : "Upgrade"}
              </button>
            </div>
          ))}
        </div>
        <p className="mt-4 text-xs text-muted">
          Koppel Stripe price IDs in omgeving (NEXT_PUBLIC_STRIPE_PRICE_*).
        </p>
      </section>
    </PageWrapper>
  );
}
