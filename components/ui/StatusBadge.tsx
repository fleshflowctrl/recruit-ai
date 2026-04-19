import { cn } from "@/lib/utils";

const MAP: Record<string, { label: string; className: string }> = {
  geschikt: { label: "Geschikt", className: "bg-green-50 text-success ring-green-200" },
  GESCHIKT: { label: "Geschikt", className: "bg-green-50 text-success ring-green-200" },
  niet_geschikt: { label: "Niet geschikt", className: "bg-red-50 text-danger ring-red-200" },
  NIET_GESCHIKT: { label: "Niet geschikt", className: "bg-red-50 text-danger ring-red-200" },
  twijfel: { label: "Twijfel", className: "bg-amber-50 text-warning ring-amber-200" },
  TWIJFEL: { label: "Twijfel", className: "bg-amber-50 text-warning ring-amber-200" },
  geen_gehoor: { label: "Geen gehoor", className: "bg-slate-100 text-muted ring-slate-200" },
  wacht: { label: "Wacht", className: "bg-blue-50 text-primary ring-blue-200" },
  actief: { label: "Actief", className: "bg-blue-50 text-primary ring-blue-200" },
  concept: { label: "Concept", className: "bg-slate-100 text-slate-500 ring-slate-200" },
  gepauzeerd: { label: "Gepauzeerd", className: "bg-amber-50 text-warning ring-amber-200" },
  afgerond: { label: "Afgerond", className: "bg-slate-100 text-muted ring-slate-200" },
  gestopt: { label: "Gestopt", className: "bg-red-50 text-danger ring-red-200" },
  inactief: { label: "Inactief", className: "bg-slate-100 text-muted ring-slate-200" },
  geplaatst: { label: "Geplaatst", className: "bg-green-50 text-success ring-green-200" },
  open: { label: "Open", className: "bg-blue-50 text-primary ring-blue-200" },
  bezig: { label: "Bezig", className: "bg-amber-50 text-warning ring-amber-200" },
  voltooid: { label: "Voltooid", className: "bg-green-50 text-success ring-green-200" },
};

export function StatusBadge({ status }: { status: string | null | undefined }) {
  const key = (status ?? "").toLowerCase();
  const cfg = MAP[key] ?? {
    label: status ?? "—",
    className: "bg-slate-100 text-slate-600 ring-slate-200",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset",
        cfg.className,
      )}
    >
      {cfg.label}
    </span>
  );
}
