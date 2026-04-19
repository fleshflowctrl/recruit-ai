export default function KandidatenLoading() {
  return (
    <div className="space-y-6 p-4 md:p-8">
      <div className="animate-pulse space-y-2">
        <div className="h-9 w-48 rounded-lg bg-slate-200" />
        <div className="h-10 w-full max-w-md rounded-xl bg-slate-100" />
      </div>
      <div className="overflow-x-auto rounded-2xl border border-border">
        <div className="min-w-[720px]">
          <div className="flex gap-4 border-b border-border bg-slate-50 p-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-4 flex-1 rounded bg-slate-200" />
            ))}
          </div>
          {Array.from({ length: 8 }).map((_, r) => (
            <div key={r} className="flex gap-4 border-b border-border p-3">
              {Array.from({ length: 8 }).map((_, c) => (
                <div
                  key={c}
                  className="h-5 flex-1 animate-pulse rounded bg-slate-100"
                />
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
