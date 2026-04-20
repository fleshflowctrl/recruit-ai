"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { createClient } from "@/lib/supabase/client";

export function KandidaatForm({ bureauId }: { bureauId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const fd = new FormData(e.currentTarget);
    const supabase = createClient();
    const { data, error: err } = await supabase
      .from("kandidaten")
      .insert({
        bureau_id: bureauId,
        naam: String(fd.get("naam")),
        telefoon: String(fd.get("telefoon")),
        email: String(fd.get("email") || "") || null,
        rijbewijs: fd.get("rijbewijs") === "on",
        beschikbaar_per: String(fd.get("beschikbaar_per") || "") || null,
        salariswens_min: fd.get("salariswens_min")
          ? Number(fd.get("salariswens_min"))
          : null,
        salariswens_max: fd.get("salariswens_max")
          ? Number(fd.get("salariswens_max"))
          : null,
        sectoren: String(fd.get("sectoren") || "")
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
        skills: String(fd.get("skills") || "")
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
        status: "actief",
        notities: String(fd.get("notities") || "") || null,
      })
      .select("id")
      .single();

    setLoading(false);
    if (err) {
      setError(err.message);
      toast.error("Er is iets misgegaan. Probeer opnieuw.");
      return;
    }
    toast.success("Kandidaat succesvol toegevoegd.");
    router.push(`/kandidaten/${data?.id}`);
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="max-w-xl space-y-4">
      <div>
        <label className="text-sm font-medium text-[color:var(--cream-text)]">
          Naam *
        </label>
        <input name="naam" required className="input-cream mt-1" />
      </div>
      <div>
        <label className="text-sm font-medium text-[color:var(--cream-text)]">
          Telefoon *
        </label>
        <input name="telefoon" required className="input-cream mt-1" />
      </div>
      <div>
        <label className="text-sm font-medium text-[color:var(--cream-text)]">
          E-mail
        </label>
        <input name="email" type="email" className="input-cream mt-1" />
      </div>
      <div className="flex items-center gap-2">
        <input id="rijbewijs" name="rijbewijs" type="checkbox" />
        <label htmlFor="rijbewijs" className="text-sm">
          Rijbewijs
        </label>
      </div>
      <div>
        <label className="text-sm font-medium text-[color:var(--cream-text)]">
          Beschikbaar per
        </label>
        <input
          name="beschikbaar_per"
          type="date"
          className="input-cream mt-1"
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium text-[color:var(--cream-text)]">
            Salaris min (€/mnd)
          </label>
          <input
            name="salariswens_min"
            type="number"
            className="input-cream mt-1"
          />
        </div>
        <div>
          <label className="text-sm font-medium text-[color:var(--cream-text)]">
            Salaris max (€/mnd)
          </label>
          <input
            name="salariswens_max"
            type="number"
            className="input-cream mt-1"
          />
        </div>
      </div>
      <div>
        <label className="text-sm font-medium text-[color:var(--cream-text)]">
          Sectoren (komma-gescheiden)
        </label>
        <input name="sectoren" className="input-cream mt-1" />
      </div>
      <div>
        <label className="text-sm font-medium text-[color:var(--cream-text)]">
          Skills (komma-gescheiden)
        </label>
        <input name="skills" className="input-cream mt-1" />
      </div>
      <div>
        <label className="text-sm font-medium text-[color:var(--cream-text)]">
          Notities
        </label>
        <textarea name="notities" rows={3} className="input-cream mt-1" />
      </div>
      {error && <p className="text-sm text-danger">{error}</p>}
      <button
        type="submit"
        disabled={loading}
        className="btn-cream-primary disabled:opacity-50"
      >
        {loading ? "Opslaan…" : "Opslaan"}
      </button>
    </form>
  );
}
