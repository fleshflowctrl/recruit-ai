export default function DashboardLoading() {
  return (
    <div className="space-y-8">
      <div className="animate-pulse space-y-3">
        <div className="h-9 w-64 rounded-md bg-[color:var(--cream-surface)]" />
        <div className="h-4 w-48 rounded-md bg-[color:var(--cream-surface)]" />
      </div>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="h-28 animate-pulse rounded-[10px] border border-[color:var(--cream-border)] bg-[color:var(--cream-surface)]"
          />
        ))}
      </div>
      <div className="grid gap-8 lg:grid-cols-5">
        <div className="h-80 animate-pulse rounded-[10px] bg-[color:var(--cream-surface)] lg:col-span-3" />
        <div className="h-80 animate-pulse rounded-[10px] bg-[color:var(--cream-surface)] lg:col-span-2" />
      </div>
    </div>
  );
}
