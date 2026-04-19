"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import { STRIPE_PLANS } from "@/lib/constants";
import type { Bureau } from "@/lib/types";

export function InstellingenClient({
  bureau: initial,
  telnyxDisplay,
  stripePriceStarter,
  stripePriceProfessional,
  stripePriceEnterprise,
}: {
  bureau: Bureau;
  telnyxDisplay: string;
  stripePriceStarter: string;
  stripePriceProfessional: string;
  stripePriceEnterprise: string;
}) {
  const [bureau, setBureau] = useState(initial);
  const [naam, setNaam] = useState(bureau.naam);
  const [email, setEmail] = useState(bureau.email);
  const [telefoon, setTelefoon] = useState(bureau.telefoon ?? "");
  const [saving, setSaving] = useState(false);

  async function saveProfiel() {
    setSaving(true);
    const t = toast.loading("Opslaan…");
    try {
      const res = await fetch("/api/bureau", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          naam,
          email,
          telefoon: telefoon || null,
        }),
      });
      const j = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(j.error ?? "Mislukt");
      setBureau((b) => ({ ...b, naam, email, telefoon: telefoon || null }));
      toast.success("Profiel opgeslagen", { id: t });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Opslaan mislukt", {
        id: t,
      });
    } finally {
      setSaving(false);
    }
  }

  async function testBel() {
    const t = toast.loading("Testbel starten…");
    try {
      const res = await fetch("/api/telnyx/test-bel", { method: "POST" });
      const j = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(j.error ?? "Mislukt");
      toast.success("Testbel gestart ✅", { id: t });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Fout bij bellen ❌", {
        id: t,
      });
    }
  }

  async function checkout(priceId: string) {
    if (!priceId) {
      toast.error("Stripe price ID ontbreekt in omgeving");
      return;
    }
    const t = toast.loading("Checkout openen…");
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ priceId }),
      });
      const j = (await res.json()) as { url?: string; error?: string };
      if (!res.ok) throw new Error(j.error ?? "Mislukt");
      if (j.url) window.location.href = j.url;
      toast.dismiss(t);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Checkout mislukt", {
        id: t,
      });
    }
  }

  const priceMap: Record<string, string> = {
    starter: stripePriceStarter,
    professional: stripePriceProfessional,
    enterprise: stripePriceEnterprise,
  };

  return (
    <>
      <section className="mb-10 rounded-2xl border border-border bg-white p-6 shadow-sm">
        <h2 className="font-serif text-lg">Bureau profiel</h2>
        <div className="mt-4 grid max-w-lg gap-3">
          <label className="block text-sm">
            <span className="text-muted">Naam</span>
            <input
              value={naam}
              onChange={(e) => setNaam(e.target.value)}
              className="mt-1 w-full rounded-xl border border-border px-3 py-2 text-sm"
            />
          </label>
          <label className="block text-sm">
            <span className="text-muted">E-mail</span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full rounded-xl border border-border px-3 py-2 text-sm"
            />
          </label>
          <label className="block text-sm">
            <span className="text-muted">Telefoon</span>
            <input
              value={telefoon}
              onChange={(e) => setTelefoon(e.target.value)}
              className="mt-1 w-full rounded-xl border border-border px-3 py-2 text-sm"
            />
          </label>
          <button
            type="button"
            disabled={saving}
            onClick={saveProfiel}
            className="mt-2 w-fit rounded-xl bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            Opslaan
          </button>
        </div>
      </section>

      <section className="mb-10 rounded-2xl border border-border bg-white p-6 shadow-sm">
        <h2 className="font-serif text-lg">Telnyx nummer</h2>
        <p className="mt-2 text-2xl font-medium tabular-nums">{telnyxDisplay}</p>
        <p className="mt-2 text-sm text-success">
          Status: actief (controleer in Telnyx-dashboard)
        </p>
        <button
          type="button"
          onClick={testBel}
          className="mt-4 rounded-xl border border-border bg-white px-4 py-2 text-sm font-medium shadow-sm hover:bg-slate-50"
        >
          Test bel
        </button>
      </section>

      <section className="rounded-2xl border border-border bg-white p-6 shadow-sm">
        <h2 className="font-serif text-lg">Abonnement</h2>
        <p className="mt-2 text-sm text-muted">
          Huidig plan: <strong>{bureau.plan}</strong> — credits:{" "}
          <strong>{bureau.credits_resterend}</strong>
        </p>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {STRIPE_PLANS.map((p) => {
            const priceId = priceMap[p.id] ?? "";
            const current = bureau.plan === p.id;
            return (
              <div
                key={p.id}
                className={`rounded-2xl border p-4 ${
                  current ? "border-primary bg-blue-50" : "border-border"
                }`}
              >
                <h3 className="font-semibold">{p.naam}</h3>
                <p className="text-2xl font-bold">€{p.prijs}/maand</p>
                <p className="text-sm text-muted">
                  {p.calls != null ? `${p.calls} calls` : "Onbeperkt"}
                </p>
                <button
                  type="button"
                  disabled={current || !priceId}
                  onClick={() => checkout(priceId)}
                  className="mt-3 w-full rounded-xl bg-primary py-2 text-sm text-white disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {current ? "Huidig plan" : "Upgrade"}
                </button>
              </div>
            );
          })}
        </div>
        <p className="mt-4 text-xs text-muted">
          Zet NEXT_PUBLIC_STRIPE_PRICE_* in .env.local om upgrades te activeren.
        </p>
      </section>
    </>
  );
}
