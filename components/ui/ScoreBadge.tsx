import { cn } from "@/lib/utils";

export function ScoreBadge({ score }: { score: number | null | undefined }) {
  if (score == null)
    return (
      <span className="font-mono text-[13px] font-medium text-[color:var(--cream-muted)]">
        —
      </span>
    );
  const colorClass =
    score >= 8
      ? "text-[#1A5C2A]"
      : score >= 5
        ? "text-[#7A5C10]"
        : "text-[#8B2020]";
  return (
    <span className={cn("font-mono text-[13px] font-medium tabular-nums", colorClass)}>
      {score}/10
    </span>
  );
}
