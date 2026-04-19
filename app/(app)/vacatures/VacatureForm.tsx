"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function VacatureForm({
  bureauId,
  opdrachtgevers,
  initial,
}: {
  bureauId: string;
  opdrachtgevers: { id: string; naam: string }[];
  initial?: Record<string, unknown>;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const edit = Boolean(initial?.id);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const fd = new FormData(e.currentTarget);
    const eisen = String(fd.get("eisen") || "")
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean);
    const payload = {
      bureau_id: bureauId,
      opdrachtgever_id: String(fd.get("opdrachtgever_id") || "") || null,
      titel: String(fd.get("titel")),
      omschrijving: String(fd.get("omschrijving") || "") || null,
      locatie: String(fd.get("locatie") || "") || null,
      sector: String(fd.get("sector") || "") || null,
      uren_per_week: fd.get("uren_per_week")
        ? Number(fd.get("uren_per_week"))
        : null,
      salaris_min: fd.get("salaris_min") ? Number(fd.get("salaris_min")) : null,
      salaris_max: fd.get("salaris_max") ? Number(fd.get("salaris_max")) : null,
      startdatum: String(fd.get("startdatum") || "") || null,
      einddatum: String(fd.get("einddatum") || "") || null,
      aantal_gezocht: fd.get("aantal_gezocht")
        ? Number(fd.get("aantal_gezocht"))
        : 1,
      eisen,
      status: String(fd.get("status") || "open"),
    };

    const supabase = createClient();
    const q = edit
      ? supabase.from("vacatures").update(payload).eq("id", String(initial!.id))
      : supabase.from("vacatures").insert(payload).select("id").single();

    const { data, error: err } = await q;
    setLoading(false);
    if (err) {
      setError(err.message);
      return;
    }
    const id = edit ? String(initial!.id) : (data as { id: string }).id;
    router.push(`/vacatures/${id}`);
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="max-w-2xl space-y-4">
      <div>
        <label className="text-sm font-medium">Opdrachtgever</label>
        <select
          name="opdrachtgever_id"
          defaultValue={String(initial?.opdrachtgever_id ?? "")}
          className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2"
        >
          <option value="">—</option>
          {opdrachtgevers.map((o) => (
            <option key={o.id} value={o.id}>
              {o.naam}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="text-sm font-medium">Titel *</label>
        <input
          name="titel"
          required
          defaultValue={String(initial?.titel ?? "")}
          className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2"
        />
      </div>
      <div>
        <label className="text-sm font-medium">Omschrijving</label>
        <textarea
          name="omschrijving"
          rows={4}
          defaultValue={String(initial?.omschrijving ?? "")}
          className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2"
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="text-sm font-medium">Locatie</label>
          <input
            name="locatie"
            defaultValue={String(initial?.locatie ?? "")}
            className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2"
          />
        </div>
        <div>
          <label className="text-sm font-medium">Sector</label>
          <input
            name="sector"
            defaultValue={String(initial?.sector ?? "")}
            className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2"
          />
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <label className="text-sm font-medium">Uren / week</label>
          <input
            name="uren_per_week"
            type="number"
            defaultValue={initial?.uren_per_week != null ? String(initial.uren_per_week) : ""}
            className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2"
          />
        </div>
        <div>
          <label className="text-sm font-medium">Salaris min €</label>
          <input
            name="salaris_min"
            type="number"
            defaultValue={initial?.salaris_min != null ? String(initial.salaris_min) : ""}
            className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2"
          />
        </div>
        <div>
          <label className="text-sm font-medium">Salaris max €</label>
          <input
            name="salaris_max"
            type="number"
            defaultValue={initial?.salaris_max != null ? String(initial.salaris_max) : ""}
            className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2"
          />
        </div>
      </div>
      <div>
        <label className="text-sm font-medium">Eisen (één per regel)</label>
        <textarea
          name="eisen"
          rows={3}
          defaultValue={Array.isArray(initial?.eisen) ? (initial?.eisen as string[]).join("\n") : ""}
          className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 font-mono text-sm"
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="text-sm font-medium">Status</label>
          <select
            name="status"
            defaultValue={String(initial?.status ?? "open")}
            className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2"
          >
            <option value="open">Open</option>
            <option value="gesloten">Gesloten</option>
            <option value="geannuleerd">Geannuleerd</option>
          </select>
        </div>
        <div>
          <label className="text-sm font-medium">Aantal gezocht</label>
          <input
            name="aantal_gezocht"
            type="number"
            min={1}
            defaultValue={String(initial?.aantal_gezocht ?? 1)}
            className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2"
          />
        </div>
      </div>
      {error && <p className="text-sm text-danger">{error}</p>}
      <button
        type="submit"
        disabled={loading}
        className="rounded-xl bg-primary px-4 py-2 text-sm text-white disabled:opacity-50"
      >
        {loading ? "Opslaan…" : "Opslaan"}
      </button>
    </form>
  );
}
