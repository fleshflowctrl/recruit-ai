"use client";

import { useState } from "react";
import toast from "react-hot-toast";

export function KandidaatActies({
  kandidaatId,
  campagneId,
}: {
  kandidaatId: string;
  campagneId?: string | null;
}) {
  const [loading, setLoading] = useState(false);

  async function bel() {
    setLoading(true);
    const t = toast.loading("Oproep starten…");
    try {
      const res = await fetch("/api/telnyx/call", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kandidaatId,
          ...(campagneId ? { campagneId } : {}),
        }),
      });
      const j = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(j.error ?? "Mislukt");
      toast.success("Oproep gestart ✅", { id: t });
    } catch (e) {
      toast.error(
        e instanceof Error ? e.message : "Fout bij bellen ❌",
        { id: t },
      );
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
        className="btn-cream-primary w-full disabled:opacity-50"
      >
        {loading ? "Bezig…" : "Bel nu"}
      </button>
    </div>
  );
}
