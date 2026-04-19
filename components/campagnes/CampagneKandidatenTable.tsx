"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import toast from "react-hot-toast";
import { DataTable, Th, Td } from "@/components/ui/DataTable";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { ScoreBadge } from "@/components/ui/ScoreBadge";
import { GesprekRapportModal } from "@/components/campagnes/GesprekRapport";
import type { Gesprek, Kandidaat, CampagneKandidaat } from "@/lib/types";

export type CampagneKandidaatRow = {
  campagneKandidaat: CampagneKandidaat;
  kandidaat: Kandidaat;
  gesprek: Gesprek | null;
};

export function CampagneKandidatenTable({
  campagneId,
  rows,
}: {
  campagneId: string;
  rows: CampagneKandidaatRow[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<CampagneKandidaatRow | null>(null);

  function openRapport(row: CampagneKandidaatRow) {
    if (!row.gesprek) {
      toast.error("Nog geen gesprek beschikbaar voor deze kandidaat.");
      return;
    }
    setSelected(row);
    setOpen(true);
  }

  return (
    <>
      <div className="overflow-x-auto">
        <DataTable>
          <thead>
            <tr>
              <Th>Naam</Th>
              <Th>Telefoon</Th>
              <Th>Status</Th>
              <Th>Score</Th>
              <Th>Aanbeveling</Th>
              <Th>Duur</Th>
              <Th>Belpogingen</Th>
              <Th>Acties</Th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const k = row.kandidaat;
              const g = row.gesprek;
              return (
                <tr
                  key={row.campagneKandidaat.id}
                  className="cursor-pointer hover:bg-slate-50/80"
                  onClick={() => openRapport(row)}
                >
                  <Td>{k.naam}</Td>
                  <Td>{k.telefoon}</Td>
                  <Td onClick={(e) => e.stopPropagation()}>
                    <StatusBadge status={row.campagneKandidaat.status} />
                  </Td>
                  <Td>
                    <ScoreBadge score={g?.score ?? null} />
                  </Td>
                  <Td>{g?.aanbeveling ?? "—"}</Td>
                  <Td>{g?.duur_seconden ? `${g.duur_seconden}s` : "—"}</Td>
                  <Td>{row.campagneKandidaat.bel_pogingen}</Td>
                  <Td onClick={(e) => e.stopPropagation()}>
                    <Link
                      href={`/kandidaten/${k.id}`}
                      className="text-primary hover:underline"
                    >
                      Profiel
                    </Link>
                  </Td>
                </tr>
              );
            })}
          </tbody>
        </DataTable>
      </div>

      <GesprekRapportModal
        open={open}
        onClose={() => {
          setOpen(false);
          setSelected(null);
        }}
        kandidaat={selected?.kandidaat ?? null}
        gesprek={selected?.gesprek ?? null}
        campagneId={campagneId}
        campagneKandidaatId={selected?.campagneKandidaat.id ?? ""}
        onUpdated={() => router.refresh()}
      />
    </>
  );
}
