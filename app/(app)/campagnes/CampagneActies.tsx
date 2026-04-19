"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function CampagneActies({
  campagneId,
  status,
}: {
  campagneId: string;
  status: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);

  async function call(path: string) {
    setLoading(path);
    await fetch(path, { method: "POST" });
    setLoading(null);
    router.refresh();
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
            onClick={() => call(`/api/campagnes/${campagneId}/pause`)}
          >
            Pauzeren
          </button>
          <button
            type="button"
            className="text-danger hover:underline"
            disabled={!!loading}
            onClick={() => call(`/api/campagnes/${campagneId}/stop`)}
          >
            Stoppen
          </button>
        </>
      )}
    </div>
  );
}
