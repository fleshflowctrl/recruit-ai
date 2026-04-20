import type { MouseEvent, ReactNode } from "react";
import { cn } from "@/lib/utils";

export function DataTable({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "table-cream-wrap overflow-x-auto shadow-none",
        className,
      )}
    >
      <table className="min-w-full border-collapse text-left text-sm">
        {children}
      </table>
    </div>
  );
}

export function Th({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <th
      className={cn(
        "whitespace-nowrap border-b border-[color:var(--cream-border)] bg-[color:var(--cream-surface)] px-4 py-2.5 text-[11px] font-medium uppercase tracking-wider text-[color:var(--cream-faint)]",
        className,
      )}
    >
      {children}
    </th>
  );
}

export function Td({
  children,
  className,
  onClick,
}: {
  children: ReactNode;
  className?: string;
  onClick?: (e: MouseEvent<HTMLTableCellElement>) => void;
}) {
  return (
    <td
      className={cn(
        "border-b border-[color:var(--cream-border)] px-4 py-3 text-[color:var(--cream-text)]",
        className,
      )}
      onClick={onClick}
    >
      {children}
    </td>
  );
}
