import { cn } from "@/lib/utils";

export function ScoreBadge({ score }: { score: number | null | undefined }) {
  if (score == null) return <span className="text-muted">—</span>;
  const color =
    score >= 8
      ? "text-success"
      : score >= 5
        ? "text-warning"
        : "text-danger";
  return (
    <span className={cn("font-semibold tabular-nums", color)}>{score}/10</span>
  );
}
