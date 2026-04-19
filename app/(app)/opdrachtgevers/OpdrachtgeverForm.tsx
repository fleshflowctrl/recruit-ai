"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function OpdrachtgeverForm({
  bureauId,
  initial,
}: {
  bureauId: string;
  initial?: Record<string, string | null>;
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
    const payload = {
      bureau_id: bureauId,
      naam: String(fd.get("naam")),
      contactpersoon: String(fd.get("contactpersoon") || "") || null,
      email: String(fd.get("email") || "") || null,
      telefoon: String(fd.get("telefoon") || "") || null,
      adres: String(fd.get("adres") || "") || null,
      sector: String(fd.get("sector") || "") || null,
      notities: String(fd.get("notities") || "") || null,
    };
    const supabase = createClient();
    const q = edit
      ? supabase.from("opdrachtgevers").update(payload).eq("id", initial!.id!)
      : supabase.from("opdrachtgevers").insert(payload).select("id").single();

    const { data, error: err } = await q;
    setLoading(false);
    if (err) {
      setError(err.message);
      return;
    }
    const id = edit ? initial!.id! : (data as { id: string }).id;
    router.push(`/opdrachtgevers/${id}`);
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="max-w-xl space-y-4">
      <div>
        <label className="text-sm font-medium">Naam *</label>
        <input
          name="naam"
          required
          defaultValue={initial?.naam ?? ""}
          className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2"
        />
      </div>
      <div>
        <label className="text-sm font-medium">Contactpersoon</label>
        <input
          name="contactpersoon"
          defaultValue={initial?.contactpersoon ?? ""}
          className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2"
        />
      </div>
      <div>
        <label className="text-sm font-medium">E-mail</label>
        <input
          name="email"
          type="email"
          defaultValue={initial?.email ?? ""}
          className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2"
        />
      </div>
      <div>
        <label className="text-sm font-medium">Telefoon</label>
        <input
          name="telefoon"
          defaultValue={initial?.telefoon ?? ""}
          className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2"
        />
      </div>
      <div>
        <label className="text-sm font-medium">Adres</label>
        <input
          name="adres"
          defaultValue={initial?.adres ?? ""}
          className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2"
        />
      </div>
      <div>
        <label className="text-sm font-medium">Sector</label>
        <input
          name="sector"
          defaultValue={initial?.sector ?? ""}
          className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2"
        />
      </div>
      <div>
        <label className="text-sm font-medium">Notities</label>
        <textarea
          name="notities"
          rows={3}
          defaultValue={initial?.notities ?? ""}
          className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2"
        />
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
