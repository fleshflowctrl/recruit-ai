import { cn } from "@/lib/utils";

export function Header({
  title,
  subtitle,
  actions,
  className,
}: {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  className?: string;
}) {
  return (
    <header
      className={cn(
        "mb-8 flex min-h-12 flex-col gap-3 border-b border-[color:var(--cream-border)] bg-[var(--cream-bg)] pb-4 sm:flex-row sm:items-center sm:justify-between sm:pb-4 md:px-0",
        className,
      )}
    >
      <div className="min-w-0">
        <h1 className="break-words text-[15px] font-medium text-[color:var(--cream-text)]">
          {title}
        </h1>
        {subtitle && (
          <p className="mt-0.5 break-words text-[13px] text-[color:var(--cream-muted)]">
            {subtitle}
          </p>
        )}
      </div>
      {actions && (
        <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>
      )}
    </header>
  );
}
