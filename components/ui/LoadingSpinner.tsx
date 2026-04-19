import { cn } from "@/lib/utils";

export function LoadingSpinner({
  className,
  label = "Laden…",
}: {
  className?: string;
  label?: string;
}) {
  return (
    <div
      className={cn("flex items-center justify-center gap-2 text-muted", className)}
      role="status"
      aria-live="polite"
    >
      <span
        className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent"
        aria-hidden
      />
      <span className="text-sm">{label}</span>
    </div>
  );
}
