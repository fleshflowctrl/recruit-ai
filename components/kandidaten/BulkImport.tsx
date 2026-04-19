"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { DataTable, Th, Td } from "@/components/ui/DataTable";

type Row = Record<string, string>;

export function BulkImport({ bureauId }: { bureauId: string }) {
  const [preview, setPreview] = useState<Row[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  function onFile(f: File | null) {
    setError(null);
    setPreview(null);
    if (!f) return;
    const reader = new FileReader();
    reader.onload = () => {
      const text = String(reader.result ?? "");
      const lines = text.split(/\r?\n/).filter(Boolean);
      if (lines.length < 2) {
        setError("CSV moet een header en minimaal één rij bevatten.");
        return;
      }
      const headers = lines[0].split(",").map((h) => h.trim().toLowerCase());
      const rows: Row[] = [];
      for (let i = 1; i < lines.length; i++) {
        const cells = lines[i].split(",").map((c) => c.trim());
        const row: Row = {};
        headers.forEach((h, idx) => {
          row[h] = cells[idx] ?? "";
        });
        rows.push(row);
      }
      setPreview(rows);
    };
    reader.readAsText(f);
  }

  async function importRows() {
    if (!preview?.length) return;
    setError(null);
    const supabase = createClient();
    for (const r of preview) {
      const naam = r.naam ?? r.name ?? "";
      const telefoon = r.telefoon ?? r.phone ?? "";
      if (!naam || !telefoon) continue;
      const { error: err } = await supabase.from("kandidaten").insert({
        bureau_id: bureauId,
        naam,
        telefoon,
        email: r.email ?? null,
        status: "actief",
      });
      if (err) {
        setError(err.message);
        return;
      }
    }
    setDone(true);
  }

  return (
    <div className="rounded-2xl border border-border bg-white p-6 shadow-sm">
      <p className="text-sm text-muted">
        Verwachte kolommen: <code>naam</code>, <code>telefoon</code>, optioneel{" "}
        <code>email</code>.
      </p>
      <input
        type="file"
        accept=".csv,text/csv"
        className="mt-4 block text-sm"
        onChange={(e) => onFile(e.target.files?.[0] ?? null)}
      />
      {error && <p className="mt-2 text-sm text-danger">{error}</p>}
      {done && (
        <p className="mt-2 text-sm text-green-600">Import voltooid.</p>
      )}
      {preview && preview.length > 0 && (
        <>
          <DataTable className="mt-4">
            <thead>
              <tr>
                {Object.keys(preview[0]).map((k) => (
                  <Th key={k}>{k}</Th>
                ))}
              </tr>
            </thead>
            <tbody>
              {preview.slice(0, 10).map((row, i) => (
                <tr key={i}>
                  {Object.values(row).map((v, j) => (
                    <Td key={j}>{v}</Td>
                  ))}
                </tr>
              ))}
            </tbody>
          </DataTable>
          <button
            type="button"
            onClick={importRows}
            className="mt-4 rounded-xl bg-primary px-4 py-2 text-sm font-medium text-white"
          >
            Importeer
          </button>
        </>
      )}
    </div>
  );
}
