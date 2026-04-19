"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { Kandidaat } from "@/lib/types";

export function KandidaatEditForm({ kandidaat }: { kandidaat: Kandidaat }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const fd = new FormData(e.currentTarget);
    const supabase = createClient();
    const { error: err } = await supabase
      .from("kandidaten")
      .update({
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
        status: String(fd.get("status") || "actief"),
        notities: String(fd.get("notities") || "") || null,
      })
      .eq("id", kandidaat.id);

    setLoading(false);
    if (err) {
      setError(err.message);
      return;
    }
    router.push(`/kandidaten/${kandidaat.id}`);
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="max-w-xl space-y-4">
      <div>
        <label className="text-sm font-medium text-slate-700">Naam *</label>
        <input
          name="naam"
          required
          defaultValue={kandidaat.naam}
          className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2"
        />
      </div>
      <div>
        <label className="text-sm font-medium text-slate-700">Telefoon *</label>
        <input
          name="telefoon"
          required
          defaultValue={kandidaat.telefoon}
          className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2"
        />
      </div>
      <div>
        <label className="text-sm font-medium text-slate-700">E-mail</label>
        <input
          name="email"
          type="email"
          defaultValue={kandidaat.email ?? ""}
          className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2"
        />
      </div>
      <div className="flex items-center gap-2">
        <input
          id="rijbewijs"
          name="rijbewijs"
          type="checkbox"
          defaultChecked={kandidaat.rijbewijs}
        />
        <label htmlFor="rijbewijs" className="text-sm">
          Rijbewijs
        </label>
      </div>
      <div>
        <label className="text-sm font-medium text-slate-700">Status</label>
        <select
          name="status"
          defaultValue={kandidaat.status}
          className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2"
        >
          <option value="actief">Actief</option>
          <option value="inactief">Inactief</option>
          <option value="geplaatst">Geplaatst</option>
        </select>
      </div>
      <div>
        <label className="text-sm font-medium text-slate-700">
          Beschikbaar per
        </label>
        <input
          name="beschikbaar_per"
          type="date"
          defaultValue={kandidaat.beschikbaar_per ?? ""}
          className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2"
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium text-slate-700">
            Salaris min
          </label>
          <input
            name="salariswens_min"
            type="number"
            defaultValue={kandidaat.salariswens_min ?? ""}
            className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2"
          />
        </div>
        <div>
          <label className="text-sm font-medium text-slate-700">
            Salaris max
          </label>
          <input
            name="salariswens_max"
            type="number"
            defaultValue={kandidaat.salariswens_max ?? ""}
            className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2"
          />
        </div>
      </div>
      <div>
        <label className="text-sm font-medium text-slate-700">Sectoren</label>
        <input
          name="sectoren"
          defaultValue={(kandidaat.sectoren ?? []).join(", ")}
          className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2"
        />
      </div>
      <div>
        <label className="text-sm font-medium text-slate-700">Skills</label>
        <input
          name="skills"
          defaultValue={(kandidaat.skills ?? []).join(", ")}
          className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2"
        />
      </div>
      <div>
        <label className="text-sm font-medium text-slate-700">Notities</label>
        <textarea
          name="notities"
          rows={3}
          defaultValue={kandidaat.notities ?? ""}
          className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2"
        />
      </div>
      {error && <p className="text-sm text-danger">{error}</p>}
      <button
        type="submit"
        disabled={loading}
        className="rounded-xl bg-primary px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
      >
        {loading ? "Opslaan…" : "Opslaan"}
      </button>
    </form>
  );
}
