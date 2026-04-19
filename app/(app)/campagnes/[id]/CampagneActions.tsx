"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import toast from "react-hot-toast";

export function CampagneActions({ campagneId }: { campagneId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);

  async function post(url: string, okToast: () => void) {
    setLoading(url);
    try {
      const res = await fetch(url, { method: "POST" });
      if (!res.ok) {
        toast.error("Er is iets misgegaan. Probeer opnieuw.");
        return;
      }
      okToast();
      router.refresh();
    } catch {
      toast.error("Er is iets misgegaan. Probeer opnieuw.");
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
      <button
        type="button"
        disabled={!!loading}
        onClick={() =>
          post(`/api/campagnes/${campagneId}/pause`, () =>
            toast("Campagne gepauzeerd."),
          )
        }
        className="rounded-xl border border-border px-4 py-2 text-sm font-medium hover:bg-slate-50"
      >
        Pauzeren
      </button>
      <button
        type="button"
        disabled={!!loading}
        onClick={() =>
          post(`/api/campagnes/${campagneId}/resume`, () =>
            toast.success("Campagne hervat."),
          )
        }
        className="rounded-xl border border-border px-4 py-2 text-sm font-medium hover:bg-slate-50"
      >
        Hervatten
      </button>
      <button
        type="button"
        disabled={!!loading}
        onClick={() =>
          post(`/api/campagnes/${campagneId}/stop`, () =>
            toast.success("Campagne gestopt."),
          )
        }
        className="rounded-xl border border-red-200 px-4 py-2 text-sm font-medium text-danger hover:bg-red-50"
      >
        Stoppen
      </button>
    </div>
  );
}
