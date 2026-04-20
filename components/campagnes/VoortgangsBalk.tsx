import { cn } from "@/lib/utils";

export function VoortgangsBalk({
  gebeld,
  totaal,
  className,
}: {
  gebeld: number;
  totaal: number;
  className?: string;
}) {
  const pct = totaal > 0 ? Math.round((gebeld / totaal) * 100) : 0;
  return (
    <div className={cn("w-full", className)}>
      <div className="h-0.5 w-full overflow-hidden rounded-[1px] bg-[#EFEDE8]">
        <div
          className="h-full rounded-[1px] bg-[#5C8A5C] transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="mt-1 font-mono text-[11px] text-[#B0AFA9]">
        {gebeld} / {totaal}
      </p>
    </div>
  );
}
