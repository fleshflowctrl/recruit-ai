export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-dashed border-border bg-slate-50/50 p-12 text-center">
      <p className="font-medium text-slate-800">{title}</p>
      {description && (
        <p className="mt-2 text-sm text-muted">{description}</p>
      )}
      {action && <div className="mt-6 flex justify-center">{action}</div>}
    </div>
  );
}
