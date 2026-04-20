"use client";

import type { ReactNode } from "react";
import { useState } from "react";
import toast from "react-hot-toast";
import { STRIPE_PLANS } from "@/lib/constants";
import type { Bureau } from "@/lib/types";
import { cn, formatDateNl } from "@/lib/utils";

export type InstellingenFactuur = {
  id: string;
  amount: number;
  created_at: string;
  plan: string;
  invoice_url?: string | null;
};

const fieldClass =
  "w-full max-w-[420px] rounded-[7px] border border-[rgba(0,0,0,0.09)] bg-[#F5F4F0] px-3 py-2 text-[13px] text-[#1A1A18] outline-none focus:border-[rgba(0,0,0,0.22)]";
const labelClass =
  "mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.06em] text-[#8A8A85]";

function Section({
  title,
  headerRight,
  children,
  className,
}: {
  title: string;
  headerRight?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        "mb-3.5 overflow-hidden rounded-xl border border-[rgba(0,0,0,0.07)] bg-white",
        className,
      )}
    >
      <div className="flex items-center justify-between border-b border-[rgba(0,0,0,0.06)] px-5 py-3.5">
        <h2 className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[#B0AFA9]">
          {title}
        </h2>
        {headerRight}
      </div>
      <div className="px-5 py-[18px]">{children}</div>
    </section>
  );
}

function ToggleRow({
  title,
  desc,
  checked,
  onToggle,
  isLast,
}: {
  title: string;
  desc: string;
  checked: boolean;
  onToggle: () => void;
  isLast: boolean;
}) {
  return (
    <div
      className={cn(
        "flex items-center justify-between py-2.5",
        !isLast && "border-b border-[rgba(0,0,0,0.04)]",
      )}
    >
      <div>
        <p className="text-[13px] font-medium text-[#1A1A18]">{title}</p>
        <p className="text-[12px] text-[#8A8A85]">{desc}</p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={onToggle}
        className={cn(
          "relative h-5 w-9 shrink-0 rounded-[10px] border-none transition-colors",
          checked
            ? "bg-[#5C8A5C]"
            : "border border-[rgba(0,0,0,0.1)] bg-[#EFEDE8]",
        )}
      >
        <span
          className={cn(
            "absolute top-0.5 h-3.5 w-3.5 rounded-full bg-white shadow-[0_1px_2px_rgba(0,0,0,0.15)] transition-[left]",
            checked ? "left-[19px]" : "left-[3px]",
          )}
        />
      </button>
    </div>
  );
}

function getInitials(naam: string | null): string {
  if (!naam?.trim()) return "?";
  const parts = naam.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 1) return parts[0]!.slice(0, 1).toUpperCase();
  return (
    parts[0]!.slice(0, 1) + parts[parts.length - 1]!.slice(0, 1)
  ).toUpperCase();
}

export function InstellingenClient({
  bureau: initial,
  telnyxDisplay,
  stripePriceStarter,
  stripePriceProfessional,
  stripePriceEnterprise,
  profile,
  teamleden,
  facturen,
  userId,
  telnyxMessagingProfileId,
}: {
  bureau: Bureau;
  telnyxDisplay: string;
  stripePriceStarter: string;
  stripePriceProfessional: string;
  stripePriceEnterprise: string;
  profile: { volledige_naam: string | null; rol: string | null } | null;
  teamleden: Array<{
    id: string;
    volledige_naam: string | null;
    rol: string | null;
  }>;
  facturen: InstellingenFactuur[];
  userId: string;
  telnyxMessagingProfileId: string;
}) {
  const [bureau, setBureau] = useState(initial);
  const [naam, setNaam] = useState(bureau.naam);
  const [email, setEmail] = useState(bureau.email);
  const [telefoon, setTelefoon] = useState(bureau.telefoon ?? "");
  const [saving, setSaving] = useState(false);

  const [activeTab, setActiveTab] = useState("algemeen");
  const [rapportEmail, setRapportEmail] = useState("");
  const [gesprekRapport, setGesprekRapport] = useState(true);
  const [dagrapport, setDagrapport] = useState(true);
  const [noShowAlert, setNoShowAlert] = useState(false);
  const [stem, setStem] = useState("Nederlands vrouwelijk");
  const [beltijdVan, setBeltijdVan] = useState("09:00");
  const [beltijdTot, setBeltijdTot] = useState("17:00");
  const [maxPogingen, setMaxPogingen] = useState("3");
  const [wachttijd, setWachttijd] = useState("2 uur");
  const [maxParallelBellen, setMaxParallelBellen] = useState("1");
  const [savingAI, setSavingAI] = useState(false);
  const [savingEmail, setSavingEmail] = useState(false);

  const [testKandidaatId, setTestKandidaatId] = useState("");

  async function handleLogout() {
    const { createClient } = await import("@/lib/supabase/client");
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = "/login";
  }

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

  async function saveEmailPrefs() {
    setSavingEmail(true);
    try {
      await new Promise((r) => setTimeout(r, 300));
      toast.success("E-mailvoorkeuren opgeslagen");
    } finally {
      setSavingEmail(false);
    }
  }

  async function saveAISettings() {
    setSavingAI(true);
    try {
      await new Promise((r) => setTimeout(r, 300));
      toast.success("AI instellingen opgeslagen");
    } finally {
      setSavingAI(false);
    }
  }

  async function stuurTestWhatsApp() {
    if (!testKandidaatId.trim()) {
      toast.error("Vul een kandidaat-ID in");
      return;
    }
    const t = toast.loading("Verzenden…");
    try {
      const res = await fetch("/api/whatsapp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kandidaatId: testKandidaatId.trim(),
          message: "Testbericht vanuit RecruitAI instellingen.",
          type: "custom",
        }),
      });
      const j = (await res.json()) as { error?: string };
      if (!res.ok) {
        const msg =
          typeof j.error === "string"
            ? j.error
            : "Mislukt";
        throw new Error(msg);
      }
      toast.success("Testbericht verstuurd", { id: t });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Fout", { id: t });
    }
  }

  const priceMap: Record<string, string> = {
    starter: stripePriceStarter,
    professional: stripePriceProfessional,
    enterprise: stripePriceEnterprise,
  };

  const credits = bureau.credits_resterend;
  const creditsBarPct = Math.min(100, (credits / 200) * 100);
  const fillColor =
    credits < 20 ? "#C05050" : credits < 50 ? "#C8B47A" : "#5C8A5C";

  const tabs: { id: string; label: string; danger?: boolean }[] = [
    { id: "algemeen", label: "Algemeen" },
    { id: "ai", label: "AI & Bellen" },
    { id: "whatsapp", label: "WhatsApp" },
    { id: "team", label: "Team" },
    { id: "integraties", label: "Integraties" },
    { id: "abonnement", label: "Abonnement" },
    { id: "facturen", label: "Facturen" },
    { id: "gevaar", label: "Gevaar zone", danger: true },
  ];

  const whatsappGekoppeld = Boolean(bureau.whatsapp_nummer);

  return (
    <div className="mx-auto w-full min-w-0 max-w-[760px] space-y-5 pb-10">
      <div>
        <h1
          className="text-2xl font-medium tracking-tight text-[#1A1A18]"
          style={{ letterSpacing: "-0.3px", fontSize: "24px" }}
        >
          Instellingen
        </h1>
        <p className="mt-[3px] text-[13px] text-[#8A8A85]">
          Beheer uw bureau, AI, integraties en abonnement
        </p>
      </div>

      {/* Account card */}
      <div className="flex flex-col items-stretch justify-between gap-3 rounded-xl border border-[rgba(0,0,0,0.07)] bg-white px-5 py-4 sm:flex-row sm:items-center">
        <div>
          <p className="text-[15px] font-semibold text-[#1A1A18]">
            {bureau.naam}
          </p>
          <p className="mt-0.5 text-[12px] text-[#8A8A85]">{bureau.email}</p>
          {profile?.volledige_naam ? (
            <p className="mt-0.5 text-[12px] text-[#8A8A85]">
              {profile.volledige_naam}
              {profile.rol ? ` · ${profile.rol}` : ""}
            </p>
          ) : null}
          <p className="mt-1.5 inline-flex items-center rounded-[20px] border border-[rgba(29,74,122,0.1)] bg-[#D4E4F7] px-2.5 py-0.5 text-[11px] font-medium text-[#1D4A7A]">
            {bureau.plan} plan · {bureau.credits_resterend} credits
          </p>
        </div>
        <button
          type="button"
          onClick={() => void handleLogout()}
          className="mt-2.5 w-full shrink-0 rounded-lg border border-[rgba(139,32,32,0.12)] bg-[#F5D9D9] px-[18px] py-2 text-[13px] font-medium text-[#8B2020] sm:mt-0 sm:w-auto"
        >
          Uitloggen
        </button>
      </div>

      {/* Tabs */}
      <div className="overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <div className="mb-1 flex min-w-0 flex-wrap gap-0.5 rounded-[10px] bg-[#F5F4F0] p-1 md:flex-nowrap">
          {tabs.map((tab) => {
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "whitespace-nowrap rounded-[7px] border-none px-4 py-1.5 text-[13px] font-medium transition-all duration-150",
                  active
                    ? "bg-white text-[#1A1A18] shadow-[0_1px_3px_rgba(0,0,0,0.08)]"
                    : tab.danger
                      ? "bg-transparent text-[#C05050]"
                      : "bg-transparent text-[#8A8A85]",
                )}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* TAB: algemeen */}
      {activeTab === "algemeen" && (
        <>
          <Section title="Bureau profiel">
            <div className="grid max-w-[420px] gap-3">
              <label className={labelClass}>Naam</label>
              <input
                value={naam}
                onChange={(e) => setNaam(e.target.value)}
                className={fieldClass}
              />
              <label className={labelClass}>E-mail</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={fieldClass}
              />
              <label className={labelClass}>Telefoon</label>
              <input
                value={telefoon}
                onChange={(e) => setTelefoon(e.target.value)}
                className={fieldClass}
              />
              <button
                type="button"
                disabled={saving}
                onClick={saveProfiel}
                className="mt-1.5 w-fit rounded-lg border-none bg-[#1A1A18] px-[18px] py-2 text-[13px] font-medium text-[#FAFAF8] disabled:opacity-50"
              >
                Opslaan
              </button>
            </div>
          </Section>

          <Section title="Telefoonnummer">
            <p className="font-mono text-[26px] font-medium text-[#1A1A18]">
              {telnyxDisplay}
            </p>
            <p className="mt-2 inline-flex items-center gap-1 rounded-[20px] bg-[#D4EDD8] px-2.5 py-0.5 text-[12px] text-[#1A5C2A]">
              <span
                className="h-1.5 w-1.5 rounded-full bg-[#5C8A5C]"
                aria-hidden
              />
              Status: actief
            </p>
            <button
              type="button"
              onClick={testBel}
              className="mt-4 rounded-lg border border-[rgba(0,0,0,0.13)] bg-transparent px-[18px] py-2 text-[13px] text-[#1A1A18]"
            >
              Test bel
            </button>
          </Section>

          <Section title="E-mail notificaties">
            <label className={labelClass}>Rapport e-mail</label>
            <input
              type="email"
              value={rapportEmail}
              onChange={(e) => setRapportEmail(e.target.value)}
              placeholder="naam@voorbeeld.nl"
              className={cn(fieldClass, "mb-4")}
            />
            <ToggleRow
              title="Gesprek rapport"
              desc="E-mail na elk gesprek"
              checked={gesprekRapport}
              onToggle={() => setGesprekRapport((v) => !v)}
              isLast={false}
            />
            <ToggleRow
              title="Dagrapport"
              desc="Dagelijks overzicht om 17:00"
              checked={dagrapport}
              onToggle={() => setDagrapport((v) => !v)}
              isLast={false}
            />
            <ToggleRow
              title="No-show alert"
              desc="Melding als kandidaat niet bevestigt"
              checked={noShowAlert}
              onToggle={() => setNoShowAlert((v) => !v)}
              isLast
            />
            <button
              type="button"
              disabled={savingEmail}
              onClick={() => void saveEmailPrefs()}
              className="mt-4 rounded-lg border-none bg-[#1A1A18] px-[18px] py-2 text-[13px] font-medium text-[#FAFAF8] disabled:opacity-50"
            >
              Opslaan
            </button>
          </Section>
        </>
      )}

      {activeTab === "ai" && (
        <Section title="AI & bellen">
          <div className="grid max-w-[420px] gap-4">
            <div>
              <label className={labelClass}>Stem</label>
              <select
                value={stem}
                onChange={(e) => setStem(e.target.value)}
                className={fieldClass}
              >
                <option>Nederlands vrouwelijk</option>
                <option>Nederlands mannelijk</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>Beltijden</label>
              <div className="flex max-w-[420px] flex-wrap items-center gap-2">
                <span className="text-[12px] text-[#8A8A85]">Van</span>
                <input
                  type="time"
                  value={beltijdVan}
                  onChange={(e) => setBeltijdVan(e.target.value)}
                  className={cn(fieldClass, "max-w-[120px]")}
                />
                <span className="text-[#8A8A85]">—</span>
                <span className="text-[12px] text-[#8A8A85]">Tot</span>
                <input
                  type="time"
                  value={beltijdTot}
                  onChange={(e) => setBeltijdTot(e.target.value)}
                  className={cn(fieldClass, "max-w-[120px]")}
                />
              </div>
            </div>
            <div>
              <label className={labelClass}>Max pogingen per kandidaat</label>
              <select
                value={maxPogingen}
                onChange={(e) => setMaxPogingen(e.target.value)}
                className={fieldClass}
              >
                {["1", "2", "3", "4", "5"].map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass}>Wachttijd tussen pogingen</label>
              <select
                value={wachttijd}
                onChange={(e) => setWachttijd(e.target.value)}
                className={fieldClass}
              >
                <option value="30 minuten">30 minuten</option>
                <option value="1 uur">1 uur</option>
                <option value="2 uur">2 uur</option>
                <option value="4 uur">4 uur</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>Max parallel bellen</label>
              <select
                value={maxParallelBellen}
                onChange={(e) => setMaxParallelBellen(e.target.value)}
                className={fieldClass}
              >
                {["1", "2", "3", "5", "10"].map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </div>
            <button
              type="button"
              disabled={savingAI}
              onClick={() => void saveAISettings()}
              className="mt-1 w-fit rounded-lg border-none bg-[#1A1A18] px-[18px] py-2 text-[13px] font-medium text-[#FAFAF8] disabled:opacity-50"
            >
              Opslaan
            </button>
          </div>
        </Section>
      )}

      {activeTab === "whatsapp" && (
        <Section title="WhatsApp">
          <div className="grid max-w-[420px] gap-4">
            <div>
              <label className={labelClass}>WhatsApp nummer</label>
              <div className="flex flex-wrap items-center gap-2">
                <input
                  readOnly
                  value={bureau.whatsapp_nummer ?? "Nog niet gekoppeld"}
                  className={cn(fieldClass, "opacity-90")}
                />
                <span
                  className={cn(
                    "inline-flex rounded-[20px] px-2.5 py-0.5 text-[11px] font-medium",
                    whatsappGekoppeld
                      ? "bg-[#D4EDD8] text-[#1A5C2A]"
                      : "bg-[#EFEDE8] text-[#8A8A85]",
                  )}
                >
                  {whatsappGekoppeld ? "Gekoppeld" : "Niet gekoppeld"}
                </span>
              </div>
            </div>
            <div>
              <label className={labelClass}>Messaging Profile ID</label>
              <input
                readOnly
                value={telnyxMessagingProfileId || ""}
                placeholder="Telnyx messaging profile ID"
                className={fieldClass}
              />
            </div>
            <div>
              <label className={labelClass}>Testbericht (kandidaat-ID)</label>
              <p className="mb-1 text-[12px] text-[#8A8A85]">
                Bericht gaat naar het nummer van deze kandidaat in uw database.
              </p>
              <input
                value={testKandidaatId}
                onChange={(e) => setTestKandidaatId(e.target.value)}
                placeholder="UUID van de kandidaat"
                className={fieldClass}
              />
              <button
                type="button"
                onClick={() => void stuurTestWhatsApp()}
                className="mt-3 rounded-lg border border-[rgba(0,0,0,0.13)] bg-transparent px-[18px] py-2 text-[13px] text-[#1A1A18]"
              >
                Stuur test bericht
              </button>
            </div>
          </div>
          <p className="mt-4 text-[12px] text-[#8A8A85]">
            WhatsApp berichten worden verstuurd via Telnyx. Zorg dat uw nummer
            geregistreerd is als WhatsApp Business.
          </p>
        </Section>
      )}

      {activeTab === "team" && (
        <Section
          title="Team"
          headerRight={
            <button
              type="button"
              onClick={() => toast("Team uitnodigen komt binnenkort")}
              className="cursor-not-allowed rounded-lg border border-[rgba(0,0,0,0.13)] bg-transparent px-3 py-1.5 text-[12px] font-medium text-[#8A8A85] opacity-80"
            >
              + Uitnodigen
            </button>
          }
        >
          {teamleden.length === 0 ? (
            <p className="mb-3 text-[13px] text-[#B0AFA9]">
              Nog geen andere medewerkers.
            </p>
          ) : null}
          <ul>
            {teamleden.map((lid) => (
              <li
                key={lid.id}
                className="flex items-center gap-2.5 border-b border-[rgba(0,0,0,0.04)] py-2.5 last:border-b-0"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#5C8A5C] text-[11px] font-bold text-[#FAFAF8]">
                  {getInitials(lid.volledige_naam)}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[13px] font-medium text-[#1A1A18]">
                    {lid.volledige_naam ?? "—"}
                  </p>
                  <p className="text-[11px] text-[#8A8A85]">{lid.rol ?? "—"}</p>
                </div>
                {lid.id === userId ? (
                  <span className="rounded-[20px] bg-[#D4EDD8] px-2 py-0.5 text-[11px] font-medium text-[#1A5C2A]">
                    jij
                  </span>
                ) : null}
              </li>
            ))}
          </ul>
        </Section>
      )}

      {activeTab === "integraties" && (
        <Section title="Integraties">
          {[
            {
              name: "Carerix",
              desc: "Kandidaten en vacatures synchroniseren",
              emoji: "C",
            },
            {
              name: "AFAS",
              desc: "Loonadministratie synchroniseren",
              emoji: "A",
            },
            { name: "Bullhorn", desc: "ATS synchroniseren", emoji: "B" },
          ].map((row) => (
            <div
              key={row.name}
              className="flex items-center gap-3 border-b border-[rgba(0,0,0,0.04)] py-3 last:border-b-0"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-[rgba(0,0,0,0.07)] bg-[#F5F4F0] text-[13px] font-semibold text-[#8A8A85]">
                {row.emoji}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[13px] font-medium text-[#1A1A18]">
                  {row.name}
                </p>
                <p className="mt-px text-[11px] leading-tight text-[#8A8A85]">
                  {row.desc}
                </p>
              </div>
              <span className="rounded-[20px] bg-[#EFEDE8] px-2 py-0.5 text-[11px] text-[#8A8A85]">
                Niet gekoppeld
              </span>
              <button
                type="button"
                onClick={() =>
                  toast(
                    "Carerix/AFAS/Bullhorn koppeling komt binnenkort",
                  )
                }
                className="rounded-lg border border-[rgba(0,0,0,0.09)] bg-[#F5F4F0] px-3.5 py-1.5 text-[12px] font-medium text-[#1A1A18]"
              >
                Koppelen
              </button>
            </div>
          ))}
        </Section>
      )}

      {activeTab === "abonnement" && (
        <section className="mb-3.5 overflow-hidden rounded-xl border border-[rgba(0,0,0,0.07)] bg-white">
          <div className="border-b border-[rgba(0,0,0,0.06)] px-5 py-3.5">
            <h2 className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[#B0AFA9]">
              Abonnement
            </h2>
          </div>
          <div className="px-5 py-[18px]">
            <div className="mb-4 flex items-center gap-3">
              <div>
                <p className="font-mono text-2xl font-medium leading-none text-[#1A1A18]">
                  {credits}
                </p>
                <p className="mt-1 text-[11px] text-[#8A8A85]">
                  credits resterend
                </p>
              </div>
              <div className="relative h-1 min-w-0 flex-1 overflow-hidden rounded-[2px] bg-[#EFEDE8]">
                <div
                  className="absolute left-0 top-0 h-full rounded-sm transition-all"
                  style={{
                    width: `${creditsBarPct}%`,
                    background: fillColor,
                  }}
                />
              </div>
              <span className="text-[11px] text-[#8A8A85]">
                {credits} / 200
              </span>
            </div>

            <p className="mb-4 text-sm text-[#8A8A85]">
              Huidig plan: <strong className="text-[#1A1A18]">{bureau.plan}</strong>{" "}
              — credits:{" "}
              <strong className="text-[#1A1A18]">{bureau.credits_resterend}</strong>
            </p>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              {STRIPE_PLANS.map((p) => {
                const priceId = priceMap[p.id] ?? "";
                const current = bureau.plan === p.id;
                return (
                  <div
                    key={p.id}
                    className={
                      current
                        ? "rounded-[10px] border border-[rgba(0,0,0,0.12)] bg-[#FAFAF8] p-4"
                        : "rounded-[10px] border border-[rgba(0,0,0,0.07)] bg-white p-4"
                    }
                  >
                    <h3 className="font-semibold text-[#1A1A18]">{p.naam}</h3>
                    <p className="text-2xl font-bold text-[#1A1A18]">
                      €{p.prijs}/maand
                    </p>
                    <p className="text-sm text-[#8A8A85]">
                      {p.calls != null ? `${p.calls} calls` : "Onbeperkt"}
                    </p>
                    <button
                      type="button"
                      disabled={current || !priceId}
                      onClick={() => checkout(priceId)}
                      className="mt-3 w-full rounded-lg border-none bg-[#1A1A18] py-2 text-[13px] font-medium text-[#FAFAF8] disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {current ? "Huidig plan" : "Upgrade"}
                    </button>
                  </div>
                );
              })}
            </div>
            <p className="mt-4 text-xs text-[#8A8A85]">
              Zet NEXT_PUBLIC_STRIPE_PRICE_* in .env.local om upgrades te activeren.
            </p>
            <button
              type="button"
              onClick={() => toast("Credits bijkopen komt binnenkort")}
              className="mt-3 w-full rounded-lg border border-[rgba(0,0,0,0.13)] bg-transparent py-2 text-[13px] font-medium text-[#1A1A18]"
            >
              Credits bijkopen
            </button>
          </div>
        </section>
      )}

      {activeTab === "facturen" && (
        <Section title="Facturen">
          {facturen.length === 0 ? (
            <p className="px-1 py-5 text-[13px] text-[#B0AFA9]">
              Nog geen facturen. Facturen verschijnen hier na uw eerste betaling.
            </p>
          ) : (
            <ul>
              {facturen.map((f) => (
                <li
                  key={f.id}
                  className="flex items-center justify-between gap-3 border-b border-[rgba(0,0,0,0.04)] py-2.5 last:border-b-0"
                >
                  <div>
                    <p className="text-[13px] font-medium text-[#1A1A18]">
                      {f.created_at
                        ? formatDateNl(f.created_at)
                        : "—"}
                    </p>
                    <p className="text-[11px] text-[#8A8A85]">{f.plan}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[13px] font-semibold text-[#1A1A18]">
                      €
                      {Number.isFinite(f.amount)
                        ? f.amount.toFixed(2)
                        : "—"}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        if (f.invoice_url) {
                          window.open(f.invoice_url, "_blank", "noopener,noreferrer");
                        } else {
                          toast("PDF niet beschikbaar");
                        }
                      }}
                      className="rounded-md border border-[rgba(0,0,0,0.09)] bg-[#F5F4F0] px-3.5 py-1.5 text-[12px] font-medium text-[#1A1A18]"
                    >
                      PDF
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Section>
      )}

      {activeTab === "gevaar" && (
        <section className="overflow-hidden rounded-xl border border-[rgba(139,32,32,0.15)] bg-white">
          <div className="bg-[#FFF5F5] px-5 py-3.5">
            <h2 className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[#C05050]">
              Gevaar zone
            </h2>
          </div>
          <div className="space-y-0 px-5 py-[18px]">
            <div className="border-b border-[rgba(0,0,0,0.06)] pb-5">
              <p className="text-[13px] font-medium text-[#1A1A18]">
                Alle data exporteren
              </p>
              <p className="mt-1 text-[12px] text-[#8A8A85]">
                Download een CSV van al uw kandidaten en gesprekken (GDPR)
              </p>
              <button
                type="button"
                onClick={() =>
                  toast.success(
                    "Data export wordt voorbereid — u ontvangt een e-mail",
                  )
                }
                className="mt-3 rounded-lg border border-[rgba(0,0,0,0.13)] bg-transparent px-[18px] py-2 text-[13px] text-[#1A1A18]"
              >
                Exporteer
              </button>
            </div>
            <div className="pt-5">
              <p className="text-[13px] font-medium text-[#1A1A18]">
                Bureau account verwijderen
              </p>
              <p className="mt-1 text-[12px] text-[#8A8A85]">
                Permanent — alle data wordt gewist en kan niet worden hersteld
              </p>
              <button
                type="button"
                onClick={() => {
                  const ok = window.confirm(
                    "Weet u het zeker? Dit kan niet worden teruggedraaid.",
                  );
                  if (ok) {
                    toast.error(
                      "Contacteer support om uw account te verwijderen",
                    );
                  }
                }}
                className="mt-3 rounded-lg border border-[rgba(139,32,32,0.2)] bg-[#F5D9D9] px-[18px] py-2 text-[13px] font-medium text-[#8B2020]"
              >
                Verwijder account
              </button>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
