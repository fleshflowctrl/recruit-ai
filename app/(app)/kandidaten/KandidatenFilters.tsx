"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useState, useTransition } from "react";

export function KandidatenFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [pending, startTransition] = useTransition();
  const [q, setQ] = useState(searchParams.get("q") ?? "");

  const push = useCallback(
    (updates: Record<string, string>) => {
      const p = new URLSearchParams(searchParams.toString());
      Object.entries(updates).forEach(([k, v]) => {
        if (!v) p.delete(k);
        else p.set(k, v);
      });
      p.delete("page");
      startTransition(() => {
        router.push(`/kandidaten?${p.toString()}`);
      });
    },
    [router, searchParams],
  );

  return (
    <div className="mb-6 flex flex-col gap-3 md:flex-row md:flex-wrap md:items-end">
      <div className="flex-1 min-w-[200px]">
        <label className="block text-xs font-medium text-muted">Zoeken</label>
        <input
          className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Naam of telefoon"
          defaultValue={searchParams.get("q") ?? ""}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") push({ q });
          }}
        />
      </div>
      <div>
        <label className="block text-xs font-medium text-muted">Status</label>
        <select
          className="mt-1 rounded-xl border border-gray-200 px-3 py-2 text-sm"
          defaultValue={searchParams.get("status") ?? ""}
          onChange={(e) => push({ status: e.target.value })}
        >
          <option value="">Alle</option>
          <option value="actief">Actief</option>
          <option value="inactief">Inactief</option>
          <option value="geplaatst">Geplaatst</option>
        </select>
      </div>
      <div>
        <label className="block text-xs font-medium text-muted">Rijbewijs</label>
        <select
          className="mt-1 rounded-xl border border-gray-200 px-3 py-2 text-sm"
          defaultValue={searchParams.get("rijbewijs") ?? ""}
          onChange={(e) => push({ rijbewijs: e.target.value })}
        >
          <option value="">Alles</option>
          <option value="ja">Ja</option>
          <option value="nee">Nee</option>
        </select>
      </div>
      {pending && (
        <span className="text-xs text-muted">Bezig…</span>
      )}
    </div>
  );
}
