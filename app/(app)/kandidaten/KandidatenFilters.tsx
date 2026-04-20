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
      <div className="min-w-[200px] flex-1">
        <label className="block text-xs font-medium text-[color:var(--cream-muted)]">
          Zoeken
        </label>
        <input
          className="input-cream mt-1 text-sm"
          placeholder="Naam of telefoon"
          defaultValue={searchParams.get("q") ?? ""}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") push({ q });
          }}
        />
      </div>
      <div>
        <label className="block text-xs font-medium text-[color:var(--cream-muted)]">
          Status
        </label>
        <select
          className="input-cream mt-1 text-sm"
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
        <label className="block text-xs font-medium text-[color:var(--cream-muted)]">
          Rijbewijs
        </label>
        <select
          className="input-cream mt-1 text-sm"
          defaultValue={searchParams.get("rijbewijs") ?? ""}
          onChange={(e) => push({ rijbewijs: e.target.value })}
        >
          <option value="">Alles</option>
          <option value="ja">Ja</option>
          <option value="nee">Nee</option>
        </select>
      </div>
      {pending && (
        <span className="text-xs text-[color:var(--cream-muted)]">Bezig…</span>
      )}
    </div>
  );
}
