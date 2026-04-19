import Link from "next/link";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { formatPhoneNl } from "@/lib/utils";
import type { Kandidaat } from "@/lib/types";

export function KandidaatKaart({ k }: { k: Kandidaat }) {
  return (
    <Link
      href={`/kandidaten/${k.id}`}
      className="block rounded-2xl border border-border bg-white p-4 shadow-sm transition hover:border-primary"
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-medium text-slate-900">{k.naam}</p>
          <p className="text-sm text-muted">{formatPhoneNl(k.telefoon)}</p>
        </div>
        <StatusBadge status={k.status} />
      </div>
    </Link>
  );
}
