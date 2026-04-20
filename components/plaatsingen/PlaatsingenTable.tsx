"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import toast from "react-hot-toast";
import { DataTable, Th, Td } from "@/components/ui/DataTable";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { formatDateNl } from "@/lib/utils";

export type PlaatsingRow = {
  id: string;
  kandidaatNaam: string;
  kandidaatId: string;
  opdrachtgeverNaam: string;
  vacatureTitel: string;
  startdatum: string | null;
  einddatum: string | null;
  status: string;
  uurtariefKandidaat: string | null;
  uurtariefOpdrachtgever: string | null;
};

export function PlaatsingenTable({
  rows,
}: {
  rows: PlaatsingRow[];
  bureauId?: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);

  async function beeindig(id: string) {
    if (!confirm("Plaatsing beëindigen?")) return;
    setBusy(id);
    const t = toast.loading("Bezig…");
    try {
      const res = await fetch(`/api/plaatsingen/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "beëindigd" }),
      });
      const j = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(j.error ?? "Mislukt");
      toast.success("Plaatsing beëindigd", { id: t });
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Fout", { id: t });
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="overflow-x-auto">
      <DataTable>
        <thead>
          <tr>
            <Th>Kandidaat</Th>
            <Th>Opdrachtgever</Th>
            <Th>Vacature</Th>
            <Th>Start / einde</Th>
            <Th>Status</Th>
            <Th>Uurtarief kand. / klant</Th>
            <Th>Acties</Th>
          </tr>
        </thead>
        <tbody>
          {rows.map((p) => (
            <tr key={p.id}>
              <Td>
                <Link
                  href={`/kandidaten/${p.kandidaatId}`}
                  className="font-medium text-primary hover:underline"
                >
                  {p.kandidaatNaam}
                </Link>
              </Td>
              <Td>{p.opdrachtgeverNaam}</Td>
              <Td>{p.vacatureTitel}</Td>
              <Td className="whitespace-nowrap text-sm">
                {p.startdatum ? formatDateNl(p.startdatum) : "—"}
                {" / "}
                {p.einddatum ? formatDateNl(p.einddatum) : "—"}
              </Td>
              <Td>
                <StatusBadge status={p.status} />
              </Td>
              <Td className="whitespace-nowrap tabular-nums text-sm">
                {p.uurtariefKandidaat ?? "—"} / {p.uurtariefOpdrachtgever ?? "—"}
              </Td>
              <Td>
                <div className="flex flex-wrap gap-2">
                  <Link
                    href={`/berichten?kandidaat=${p.kandidaatId}`}
                    className="btn-cream-secondary px-2 py-1 text-xs"
                  >
                    WhatsApp sturen
                  </Link>
                  <button
                    type="button"
                    disabled={busy === p.id || p.status === "beëindigd"}
                    onClick={() => beeindig(p.id)}
                    className="rounded-lg border border-red-200 bg-red-50 px-2 py-1 text-xs font-medium text-red-800 hover:bg-red-100 disabled:opacity-50"
                  >
                    Beëindig plaatsing
                  </button>
                </div>
              </Td>
            </tr>
          ))}
        </tbody>
      </DataTable>
    </div>
  );
}
