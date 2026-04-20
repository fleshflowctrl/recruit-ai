export default function KandidatenLoading() {
  return (
    <div className="space-y-6">
      <div className="animate-pulse space-y-2">
        <div className="h-9 w-48 rounded-md bg-[color:var(--cream-surface)]" />
        <div className="h-10 w-full max-w-md rounded-[7px] bg-[color:var(--cream-surface)]" />
      </div>
      <div className="overflow-x-auto rounded-[10px] border border-[color:var(--cream-border)]">
        <div className="w-full min-w-[min(100%,720px)]">
          <div className="flex gap-4 border-b border-[color:var(--cream-border)] bg-[color:var(--cream-surface)] p-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="h-4 flex-1 rounded-sm bg-[color:var(--cream-raised)]"
              />
            ))}
          </div>
          {Array.from({ length: 8 }).map((_, r) => (
            <div
              key={r}
              className="flex gap-4 border-b border-[color:var(--cream-border)] p-3"
            >
              {Array.from({ length: 8 }).map((_, c) => (
                <div
                  key={c}
                  className="h-5 flex-1 animate-pulse rounded-sm bg-[color:var(--cream-surface)]"
                />
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
