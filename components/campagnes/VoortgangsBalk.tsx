import { cn } from "@/lib/utils";

export function VoortgangsBalk({
  gebeld,
  totaal,
}: {
  gebeld: number;
  totaal: number;
}) {
  const pct = totaal > 0 ? Math.round((gebeld / totaal) * 100) : 0;
  return (
    <div className="w-full">
      <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
        <div
          className={cn("h-full rounded-full bg-primary transition-all")}
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="mt-1 text-xs text-muted">
        {gebeld} / {totaal} gebeld ({pct}%)
      </p>
    </div>
  );
}
