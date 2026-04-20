"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export function NotitiesForm({
  kandidaatId,
  initial,
}: {
  kandidaatId: string;
  initial: string;
}) {
  const [value, setValue] = useState(initial);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function save() {
    setSaving(true);
    setMsg(null);
    const supabase = createClient();
    const { error } = await supabase
      .from("kandidaten")
      .update({ notities: value })
      .eq("id", kandidaatId);
    setSaving(false);
    if (error) setMsg(error.message);
    else setMsg("Opgeslagen.");
  }

  return (
    <div className="mt-6">
      <label className="text-sm font-medium text-slate-700">Notities</label>
      <textarea
        value={value}
        onChange={(e) => setValue(e.target.value)}
        rows={4}
        className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm"
      />
      <button
        type="button"
        onClick={save}
        disabled={saving}
        className="btn-cream-primary mt-2 disabled:opacity-50"
      >
        {saving ? "Opslaan…" : "Notities opslaan"}
      </button>
      {msg && <p className="mt-1 text-xs text-muted">{msg}</p>}
    </div>
  );
}
