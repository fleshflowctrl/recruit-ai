export function StatCard({
  label,
  value,
  accent: _accent = "blue",
}: {
  label: string;
  value: React.ReactNode;
  accent?: "blue" | "cyan" | "green" | "orange" | "grey";
}) {
  void _accent;
  return (
    <div className="rounded-[10px] border border-[color:var(--cream-border)] bg-[color:var(--cream-surface)] p-4">
      <p className="font-mono text-2xl font-medium leading-tight text-[color:var(--cream-text)]">
        {value}
      </p>
      <p className="mt-1 text-xs leading-snug text-[color:var(--cream-muted)]">
        {label}
      </p>
    </div>
  );
}
