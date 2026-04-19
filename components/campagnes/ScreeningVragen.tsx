"use client";

import { useState } from "react";

export function ScreeningVragenEditor({
  value,
  onChange,
}: {
  value: string[];
  onChange: (v: string[]) => void;
}) {
  const [draft, setDraft] = useState("");

  function add() {
    if (!draft.trim() || value.length >= 8) return;
    onChange([...value, draft.trim()]);
    setDraft("");
  }

  function remove(i: number) {
    onChange(value.filter((_, idx) => idx !== i));
  }

  return (
    <div className="space-y-3">
      <ul className="space-y-2">
        {value.map((v, i) => (
          <li
            key={i}
            className="flex items-start justify-between gap-2 rounded-xl border border-border bg-slate-50 px-3 py-2 text-sm"
          >
            <span>{v}</span>
            <button
              type="button"
              onClick={() => remove(i)}
              className="text-danger text-xs"
            >
              Verwijderen
            </button>
          </li>
        ))}
      </ul>
      <div className="flex flex-col gap-2 sm:flex-row">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Nieuwe vraag"
          className="flex-1 rounded-xl border border-gray-200 px-3 py-2 text-sm"
        />
        <button
          type="button"
          onClick={add}
          disabled={value.length >= 8}
          className="rounded-xl border border-border px-3 py-2 text-sm font-medium hover:bg-slate-50 disabled:opacity-50"
        >
          + Vraag toevoegen
        </button>
      </div>
      <p className="text-xs text-muted">Maximaal 8 vragen.</p>
    </div>
  );
}
