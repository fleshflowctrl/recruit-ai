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
    <div className="w-20">
      <div className="h-0.5 w-20 overflow-hidden rounded-[1px] bg-[color:var(--cream-raised)]">
        <div
          className={cn("h-full rounded-[1px] bg-[#5C8A5C] transition-all")}
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="mt-1 text-xs text-[color:var(--cream-muted)]">
        {gebeld} / {totaal} gebeld ({pct}%)
      </p>
    </div>
  );
}
