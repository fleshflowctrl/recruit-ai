import { PageWrapper } from "@/components/layout/PageWrapper";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { VoortgangsBalk } from "@/components/campagnes/VoortgangsBalk";
import { ActivityFeed } from "@/components/dashboard/ActivityFeed";
import { LiveHero } from "@/components/dashboard/LiveHero";
import { StatCardSparkline } from "@/components/dashboard/StatCardSparkline";
import { createClient } from "@/lib/supabase/server";
import { getSessionContext } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { addMinutes, format } from "date-fns";
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
    { count: _openVacatures },
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

  const eersteActieveCampagne = (recenteCampagnes ?? []).find(
    (c) => c.status === "actief",
  );
  const gestartHero = eersteActieveCampagne
    ? format(new Date(eersteActieveCampagne.aangemaakt_op), "HH:mm")
    : "--:--";
  const remainingKandidaten =
    eersteActieveCampagne != null
      ? Math.max(
          0,
          (eersteActieveCampagne.totaal_kandidaten ?? 0) -
            (eersteActieveCampagne.gebeld ?? 0),
        )
      : 0;
  const verwachtMinuten = Math.max(10, Math.min(240, remainingKandidaten * 3));
  const verwachtKlaarHero = eersteActieveCampagne
    ? format(
        addMinutes(
          new Date(eersteActieveCampagne.aangemaakt_op),
          verwachtMinuten,
        ),
        "HH:mm",
      )
    : "--:--";

  return (
    <PageWrapper className="space-y-5 p-4 md:p-8">
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row">
        <div>
          <h1 className="text-[26px] font-medium text-[#1A1A18]">
            Goedemorgen,{" "}
            <span className="text-[#8A8A85]">{ctx.bureau.naam}</span>
          </h1>
          <p className="mt-1 text-[13px] text-[#8A8A85]">{datumCap}</p>
        </div>
        <Link href="/campagnes/nieuw" className="btn-primary shrink-0">
          + Nieuwe campagne
        </Link>
      </div>

      <LiveHero
        campagneNaam={eersteActieveCampagne?.naam ?? ""}
        gestart={gestartHero}
        verwachtKlaar={verwachtKlaarHero}
        actieveCalls={[]}
        gebeldVandaag={gebeldVandaagVoltooid ?? 0}
        isActive={(actieveCampagnes ?? 0) > 0}
      />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <StatCardSparkline
          label="Geschiktheid vandaag"
          value={`${pct}%`}
          valueColor="green"
          trend={pct > 70 ? "↑ goed" : pct > 40 ? "—" : "↓ laag"}
          trendType={pct > 70 ? "up" : pct > 40 ? "flat" : "down"}
          sparkData={[65, 70, 68, 75, 72, 80, pct]}
        />
        <StatCardSparkline
          label="Gebeld vandaag"
          value={gebeldVandaagVoltooid ?? 0}
          trend="↑ +8"
          trendType="up"
          sparkData={[20, 28, 22, 35, 30, 40, gebeldVandaagVoltooid ?? 0]}
        />
        <StatCardSparkline
          label="Actieve plaatsingen"
          value={plaatsingenActief ?? 0}
          trendType="flat"
          sparkData={[1, 1, 2, 2, 2, 2, plaatsingenActief ?? 0]}
        />
        <StatCardSparkline
          label="Actieve campagnes"
          value={actieveCampagnes ?? 0}
          trend={`${actieveCampagnes ?? 0} actief`}
          trendType="up"
          sparkData={[0, 1, 1, 2, 1, 2, actieveCampagnes ?? 0]}
        />
        <StatCardSparkline
          label="Credits resterend"
          value={credits}
          valueColor={
            credits < 20 ? "red" : credits < 50 ? "amber" : "default"
          }
          trend={
            credits < 20 ? "laag" : credits < 50 ? "let op" : undefined
          }
          trendType={credits < 20 ? "warn" : "flat"}
          sparkData={[150, 140, 130, 120, 110, 100, credits]}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
        <section>
          <div className="mb-3 flex items-center justify-between gap-2">
            <h2 className="section-label">Recente campagnes</h2>
            <Link href="/campagnes/nieuw" className="text-link">
              Nieuwe campagne →
            </Link>
          </div>

          <div className="space-y-2">
            {(recenteCampagnes ?? []).map((c) => (
              <Link href={`/campagnes/${c.id}`} key={c.id}>
                <div className="campagne-card">
                  <div className="cc-top">
                    <div>
                      <div className="cc-name">{c.naam}</div>
                      <div className="cc-type capitalize">{c.type}</div>
                    </div>
                    <StatusBadge status={c.status} />
                  </div>
                  <VoortgangsBalk
                    gebeld={c.gebeld ?? 0}
                    totaal={c.totaal_kandidaten ?? 0}
                  />
                  <div className="cc-nums">
                    <span className="cc-num green">
                      geschikt <b>{c.geschikt ?? 0}</b>
                    </span>
                    <span className="cc-num">
                      twijfel <b>{c.twijfel ?? 0}</b>
                    </span>
                    <span className="cc-num red">
                      niet <b>{c.niet_geschikt ?? 0}</b>
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>

        <section>
          <h2 className="section-label mb-3">Recente activiteit</h2>
          <div className="cream-panel">
            <ActivityFeed bureauId={bureauId} />
          </div>
        </section>
      </div>

      <div className="flex flex-wrap gap-2 border-t border-[rgba(0,0,0,0.07)] pt-5">
        <Link href="/campagnes/nieuw" className="btn-secondary">
          + Nieuwe campagne
        </Link>
        <Link href="/kandidaten/nieuw" className="btn-secondary">
          + Kandidaat toevoegen
        </Link>
        <Link href="/vacatures/nieuw" className="btn-secondary">
          + Vacature aanmaken
        </Link>
      </div>
    </PageWrapper>
  );
}
