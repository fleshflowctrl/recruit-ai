"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import toast from "react-hot-toast";

export function CampagneActies({
  campagneId,
  status,
}: {
  campagneId: string;
  status: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);

  async function call(path: string, okToast: () => void) {
    setLoading(path);
    try {
      const res = await fetch(path, { method: "POST" });
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
    <div className="flex flex-wrap gap-2 text-xs">
      <Link href={`/campagnes/${campagneId}`} className="text-primary hover:underline">
        Bekijken
      </Link>
      {status === "actief" && (
        <>
          <button
            type="button"
            className="text-warning hover:underline"
            disabled={!!loading}
            onClick={() =>
              call(`/api/campagnes/${campagneId}/pause`, () =>
                toast("Campagne gepauzeerd."),
              )
            }
          >
            Pauzeren
          </button>
          <button
            type="button"
            className="text-danger hover:underline"
            disabled={!!loading}
            onClick={() =>
              call(`/api/campagnes/${campagneId}/stop`, () =>
                toast.success("Campagne gestopt."),
              )
            }
          >
            Stoppen
          </button>
        </>
      )}
    </div>
  );
}
