import { PageWrapper } from "@/components/layout/PageWrapper";
import { StatCard } from "@/components/ui/StatCard";
import { DataTable, Th, Td } from "@/components/ui/DataTable";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { VoortgangsBalk } from "@/components/campagnes/VoortgangsBalk";
import { ActivityFeed } from "@/components/dashboard/ActivityFeed";
import { createClient } from "@/lib/supabase/server";
import { getSessionContext } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";
import { nl } from "date-fns/locale";

export default async function DashboardPage() {
  const ctx = await getSessionContext();
  if (!ctx) redirect("/login");

  const supabase = await createClient();
  const bureauId = ctx.bureau.id;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const [
    { count: actieveCampagnes },
    { count: gebeldVandaagVoltooid },
    { data: voltooidVandaagLijst },
    { data: bureauCredits },
    { count: plaatsingenActief },
    { count: openVacatures },
    { data: recenteCampagnes },
  ] = await Promise.all([
    supabase
      .from("campagnes")
      .select("*", { count: "exact", head: true })
      .eq("bureau_id", bureauId)
      .eq("status", "actief"),
    supabase
      .from("gesprekken")
      .select("*", { count: "exact", head: true })
      .eq("bureau_id", bureauId)
      .eq("status", "voltooid")
      .gte("aangemaakt_op", today.toISOString())
      .lt("aangemaakt_op", tomorrow.toISOString()),
    supabase
      .from("gesprekken")
      .select("aanbeveling")
      .eq("bureau_id", bureauId)
      .eq("status", "voltooid")
      .gte("aangemaakt_op", today.toISOString())
      .lt("aangemaakt_op", tomorrow.toISOString()),
    supabase
      .from("bureaus")
      .select("credits_resterend")
      .eq("id", bureauId)
      .single(),
    supabase
      .from("plaatsingen")
      .select("*", { count: "exact", head: true })
      .eq("bureau_id", bureauId)
      .neq("status", "beëindigd"),
    supabase
      .from("vacatures")
      .select("*", { count: "exact", head: true })
      .eq("bureau_id", bureauId)
      .eq("status", "open"),
    supabase
      .from("campagnes")
      .select("*")
      .eq("bureau_id", bureauId)
      .order("aangemaakt_op", { ascending: false })
      .limit(8),
  ]);

  const totGebeld = voltooidVandaagLijst?.length ?? 0;
  const geschiktVandaag =
    voltooidVandaagLijst?.filter((g) => g.aanbeveling === "GESCHIKT")
      .length ?? 0;
  const pct =
    totGebeld > 0 ? Math.round((geschiktVandaag / totGebeld) * 100) : 0;

  const credits =
    bureauCredits?.credits_resterend ?? ctx.bureau.credits_resterend;

  const datumLabel = format(new Date(), "EEEE d MMMM yyyy", { locale: nl });
  const datumCap =
    datumLabel.charAt(0).toUpperCase() + datumLabel.slice(1);

  return (
    <PageWrapper className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-[26px] font-medium text-[color:var(--cream-text)]">
            Goedemorgen, {ctx.bureau.naam}
          </h1>
          <p className="mt-1 text-[13px] text-[color:var(--cream-muted)]">
            {datumCap}
          </p>
        </div>
        <Link href="/campagnes/nieuw" className="btn-cream-primary shrink-0">
          Nieuwe campagne
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-6">
        <StatCard
          label="Actieve campagnes"
          value={actieveCampagnes ?? 0}
          accent="blue"
        />
        <StatCard
          label="Kandidaten gebeld vandaag"
          value={gebeldVandaagVoltooid ?? 0}
          accent="cyan"
        />
        <StatCard
          label="Geschiktheidspercentage"
          value={`${pct}%`}
          accent="green"
        />
        <StatCard
          label="Credits resterend"
          value={credits}
          accent={credits < 20 ? "orange" : "blue"}
        />
        <StatCard
          label="Actieve plaatsingen"
          value={plaatsingenActief ?? 0}
          accent="blue"
        />
        <StatCard
          label="Openstaande vacatures"
          value={openVacatures ?? 0}
          accent="grey"
        />
      </div>

      <div className="grid gap-8 lg:grid-cols-5">
        <section className="lg:col-span-3">
          <div className="mb-3 flex items-end justify-between gap-3">
            <h2 className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[color:var(--cream-faint)]">
              Recente campagnes
            </h2>
            <Link
              href="/campagnes/nieuw"
              className="text-[13px] font-medium text-[color:var(--cream-text)] underline-offset-2 hover:underline"
            >
              Nieuwe campagne
            </Link>
          </div>
          <div className="overflow-x-auto">
            <DataTable>
              <thead>
                <tr>
                  <Th>Naam</Th>
                  <Th>Type</Th>
                  <Th>Voortgang</Th>
                  <Th>Geschikt</Th>
                  <Th>Status</Th>
                  <Th>Datum</Th>
                </tr>
              </thead>
              <tbody>
                {(recenteCampagnes ?? []).map((c) => (
                  <tr key={c.id}>
                    <Td>
                      <Link
                        href={`/campagnes/${c.id}`}
                        className="font-medium text-[color:var(--cream-text)] hover:underline"
                      >
                        {c.naam}
                      </Link>
                    </Td>
                    <Td className="capitalize">{c.type}</Td>
                    <Td>
                      <VoortgangsBalk
                        gebeld={c.gebeld ?? 0}
                        totaal={c.totaal_kandidaten ?? 0}
                      />
                    </Td>
                    <Td>{c.geschikt ?? 0}</Td>
                    <Td>
                      <StatusBadge status={c.status} />
                    </Td>
                    <Td className="whitespace-nowrap text-[color:var(--cream-muted)]">
                      {format(new Date(c.aangemaakt_op), "d MMM yyyy", {
                        locale: nl,
                      })}
                    </Td>
                  </tr>
                ))}
              </tbody>
            </DataTable>
          </div>
        </section>

        <section className="lg:col-span-2">
          <h2 className="mb-3 text-[10px] font-semibold uppercase tracking-[0.1em] text-[color:var(--cream-faint)]">
            Recente activiteit
          </h2>
          <ActivityFeed bureauId={bureauId} />
        </section>
      </div>

      <div className="flex flex-wrap gap-3 border-t border-[color:var(--cream-border)] pt-6">
        <Link href="/campagnes/nieuw" className="btn-cream-secondary">
          + Nieuwe campagne
        </Link>
        <Link href="/kandidaten/nieuw" className="btn-cream-secondary">
          + Kandidaat toevoegen
        </Link>
        <Link href="/vacatures/nieuw" className="btn-cream-secondary">
          + Vacature aanmaken
        </Link>
      </div>
    </PageWrapper>
  );
}
