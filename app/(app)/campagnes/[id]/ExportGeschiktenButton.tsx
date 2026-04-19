"use client";

export function ExportGeschiktenButton({
  rows,
}: {
  rows: { naam: string; telefoon: string; score?: number | null }[];
}) {
  function run() {
    const lines = [
      ["naam", "telefoon", "score"].join(","),
      ...rows.map((r) =>
        [
          `"${r.naam.replace(/"/g, '""')}"`,
          r.telefoon,
          r.score ?? "",
        ].join(","),
      ),
    ];
    const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "geschikten.csv";
    a.click();
  }

  return (
    <button
      type="button"
      onClick={run}
      className="rounded-xl border border-border px-4 py-2 text-sm font-medium hover:bg-slate-50"
    >
      Exporteer geschikten (CSV)
    </button>
  );
}
