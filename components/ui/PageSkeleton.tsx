export function PageSkeleton() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="h-10 w-64 rounded-md bg-[color:var(--cream-surface)]" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div
            key={i}
            className="h-28 rounded-[10px] bg-[color:var(--cream-surface)]"
          />
        ))}
      </div>
      <div className="h-64 rounded-[10px] bg-[color:var(--cream-surface)]" />
    </div>
  );
}
