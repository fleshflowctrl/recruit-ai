"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function CampagneActions({ campagneId }: { campagneId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);

  async function post(url: string) {
    setLoading(url);
    await fetch(url, { method: "POST" });
    setLoading(null);
    router.refresh();
  }

  return (
    <div className="flex flex-wrap gap-2">
      <button
        type="button"
        disabled={!!loading}
        onClick={() => post(`/api/campagnes/${campagneId}/pause`)}
        className="rounded-xl border border-border px-4 py-2 text-sm font-medium hover:bg-slate-50"
      >
        Pauzeren
      </button>
      <button
        type="button"
        disabled={!!loading}
        onClick={() => post(`/api/campagnes/${campagneId}/resume`)}
        className="rounded-xl border border-border px-4 py-2 text-sm font-medium hover:bg-slate-50"
      >
        Hervatten
      </button>
      <button
        type="button"
        disabled={!!loading}
        onClick={() => post(`/api/campagnes/${campagneId}/stop`)}
        className="rounded-xl border border-red-200 px-4 py-2 text-sm font-medium text-danger hover:bg-red-50"
      >
        Stoppen
      </button>
    </div>
  );
}
