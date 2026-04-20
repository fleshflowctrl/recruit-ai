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
    <div className="panel-cream border-dashed p-12 text-center shadow-none">
      <p className="text-[32px] leading-none opacity-40" aria-hidden>
        ○
      </p>
      <p className="mt-4 text-[14px] font-medium text-[color:var(--cream-faint)]">
        {title}
      </p>
      {description && (
        <p className="mt-2 text-sm text-[color:var(--cream-muted)]">
          {description}
        </p>
      )}
      {action && <div className="mt-6 flex justify-center">{action}</div>}
    </div>
  );
}
