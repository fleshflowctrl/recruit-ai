import { cn } from "@/lib/utils";

const accentMap = {
  blue: "border-l-primary text-primary",
  cyan: "border-l-accent text-accent",
  green: "border-l-success text-success",
  orange: "border-l-warning text-warning",
  grey: "border-l-muted text-muted",
} as const;

export function StatCard({
  label,
  value,
  accent = "blue",
}: {
  label: string;
  value: React.ReactNode;
  accent?: keyof typeof accentMap;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-border bg-white p-6 shadow-sm",
        "border-l-4",
        accentMap[accent],
      )}
    >
      <p className="text-sm font-medium text-muted">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-slate-900">{value}</p>
    </div>
  );
}
