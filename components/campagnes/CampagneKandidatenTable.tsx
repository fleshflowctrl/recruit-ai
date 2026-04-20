"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import toast from "react-hot-toast";
import { DataTable, Th, Td } from "@/components/ui/DataTable";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { ScoreBadge } from "@/components/ui/ScoreBadge";
import { GesprekRapportModal } from "@/components/campagnes/GesprekRapport";
import type {
  Gesprek,
  Kandidaat,
  CampagneKandidaat,
  PlaatsingPrefill,
} from "@/lib/types";

export type CampagneKandidaatRow = {
  campagneKandidaat: CampagneKandidaat;
  kandidaat: Kandidaat;
  gesprek: Gesprek | null;
};

export function CampagneKandidatenTable({
  campagneId,
  rows,
  plaatsingPrefill,
}: {
  campagneId: string;
  rows: CampagneKandidaatRow[];
  plaatsingPrefill: PlaatsingPrefill | null;
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
                  className="cursor-pointer hover:bg-[color:var(--cream-surface)]"
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
                    <div className="flex flex-wrap gap-2">
                      {row.campagneKandidaat.status === "geschikt" && (
                        <Link
                          href={`/berichten?kandidaat=${k.id}`}
                          className="rounded-lg border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-900 hover:bg-emerald-100"
                        >
                          WhatsApp sturen
                        </Link>
                      )}
                      <Link
                        href={`/kandidaten/${k.id}`}
                        className="text-primary hover:underline"
                      >
                        Profiel
                      </Link>
                    </div>
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
        plaatsingPrefill={plaatsingPrefill}
        onUpdated={() => router.refresh()}
      />
    </>
  );
}
