"use client";

import { useState } from "react";

export function KandidaatActies({
  kandidaatId,
}: {
  kandidaatId: string;
}) {
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function bel() {
    setLoading(true);
    setMsg(null);
    try {
      const res = await fetch("/api/telnyx/call", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kandidaatId }),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error ?? "Mislukt");
      setMsg("Oproep gestart.");
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Fout");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-3">
      <button
        type="button"
        onClick={bel}
        disabled={loading}
        className="w-full rounded-xl bg-primary py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
      >
        {loading ? "Bezig…" : "Bel nu"}
      </button>
      {msg && <p className="text-xs text-muted">{msg}</p>}
    </div>
  );
}
