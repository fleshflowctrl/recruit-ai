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
            className="flex items-start justify-between gap-2 rounded-[7px] border border-[color:var(--cream-border)] bg-[color:var(--cream-surface)] px-3 py-2 text-sm text-[color:var(--cream-text)]"
          >
            <span>{v}</span>
            <button
              type="button"
              onClick={() => remove(i)}
              className="text-xs text-[color:var(--cream-red-text)] hover:underline"
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
          className="input-cream flex-1 text-sm"
        />
        <button
          type="button"
          onClick={add}
          disabled={value.length >= 8}
          className="btn-cream-secondary whitespace-nowrap disabled:opacity-50"
        >
          + Vraag toevoegen
        </button>
      </div>
      <p className="text-xs text-[color:var(--cream-muted)]">Maximaal 8 vragen.</p>
    </div>
  );
}
