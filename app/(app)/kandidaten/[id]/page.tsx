import Link from "next/link";
import { notFound } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { ScoreBadge } from "@/components/ui/ScoreBadge";
import { KandidaatActies } from "@/components/kandidaten/KandidaatActies";
import { WhatsAppPanel } from "./WhatsAppPanel";
import { NotitiesForm } from "./NotitiesForm";
import { createClient } from "@/lib/supabase/server";
import { getSessionContext } from "@/lib/auth";
import { redirect } from "next/navigation";
import {
  formatDateNl,
  formatEuro,
  formatPhoneNl,
  timeAgoNl,
} from "@/lib/utils";

export default async function KandidaatDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const ctx = await getSessionContext();
  if (!ctx) redirect("/login");
  const { id } = await params;

  const supabase = await createClient();
  const { data: k } = await supabase
    .from("kandidaten")
    .select("*")
    .eq("id", id)
    .eq("bureau_id", ctx.bureau.id)
    .single();

  if (!k) notFound();

  const { data: gesprekken } = await supabase
    .from("gesprekken")
    .select("*")
    .eq("kandidaat_id", id)
    .order("aangemaakt_op", { ascending: false });

  const campagneIds = [
    ...new Set(
      (gesprekken ?? []).map((g) => g.campagne_id).filter(Boolean),
    ),
  ] as string[];
  const campagneNaam: Record<string, string> = {};
  if (campagneIds.length) {
    const { data: campagneRows } = await supabase
      .from("campagnes")
      .select("id, naam")
      .in("id", campagneIds);
    for (const c of campagneRows ?? []) {
      campagneNaam[c.id] = c.naam;
    }
  }

  const { data: berichten } = await supabase
    .from("berichten")
    .select("*")
    .eq("kandidaat_id", id)
    .order("aangemaakt_op", { ascending: true });

  const latestCampagneId =
    (gesprekken ?? []).find((g) => g.campagne_id)?.campagne_id ?? null;

  const scoresMetDatum = (gesprekken ?? [])
    .filter((g) => g.score != null)
    .map((g) => ({
      score: g.score as number,
      datum: g.aangemaakt_op,
      campagne: g.campagne_id ? campagneNaam[g.campagne_id] : undefined,
    }));

  const scores = scoresMetDatum.map((s) => s.score);
  const avg =
    scores.length ?
      Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
    : null;

  const { count: plaatsCount } = await supabase
    .from("plaatsingen")
    .select("*", { count: "exact", head: true })
    .eq("kandidaat_id", id);

  return (
    <PageWrapper>
      <Header
        title={k.naam}
        subtitle={`${formatPhoneNl(k.telefoon)}${k.email ? ` · ${k.email}` : ""} · Aangemaakt ${formatDateNl(k.aangemaakt_op)}`}
        actions={<StatusBadge status={k.status} />}
      />

      <div className="grid gap-8 lg:grid-cols-5">
        <div className="space-y-8 lg:col-span-3">
          <section className="rounded-2xl border border-border bg-white p-6 shadow-sm">
            <h2 className="font-serif text-lg text-slate-900">Profiel</h2>
            <dl className="mt-4 grid gap-2 text-sm">
              <div>
                <dt className="text-muted">Beschikbaar per</dt>
                <dd>{k.beschikbaar_per ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-muted">Salariswens</dt>
                <dd>{formatEuro(k.salariswens_min, k.salariswens_max)} per maand</dd>
              </div>
              <div>
                <dt className="text-muted">Rijbewijs</dt>
                <dd>{k.rijbewijs ? "Ja" : "Nee"}</dd>
              </div>
              <div>
                <dt className="text-muted">Sectoren</dt>
                <dd className="flex flex-wrap gap-1">
                  {(k.sectoren ?? []).map((s: string) => (
                    <span
                      key={s}
                      className="rounded-full bg-slate-100 px-2 py-0.5 text-xs"
                    >
                      {s}
                    </span>
                  ))}
                  {!k.sectoren?.length && "—"}
                </dd>
              </div>
              <div>
                <dt className="text-muted">Skills</dt>
                <dd className="flex flex-wrap gap-1">
                  {(k.skills ?? []).map((s: string) => (
                    <span
                      key={s}
                      className="rounded-full bg-blue-50 px-2 py-0.5 text-xs text-primary"
                    >
                      {s}
                    </span>
                  ))}
                  {!k.skills?.length && "—"}
                </dd>
              </div>
            </dl>
            <NotitiesForm kandidaatId={k.id} initial={k.notities ?? ""} />
          </section>

          <section className="rounded-2xl border border-border bg-white p-6 shadow-sm">
            <h2 className="font-serif text-lg text-slate-900">Score-geschiedenis</h2>
            <ul className="mt-3 space-y-2 text-sm">
              {scoresMetDatum.length === 0 && (
                <li className="text-muted">Nog geen scores.</li>
              )}
              {scoresMetDatum.map((s, i) => (
                <li
                  key={`${s.datum}-${i}`}
                  className="flex items-center justify-between rounded-lg border border-border px-3 py-2"
                >
                  <span>
                    <ScoreBadge score={s.score} />{" "}
                    <span className="text-muted">
                      {formatDateNl(s.datum)}
                      {s.campagne ? ` · ${s.campagne}` : ""}
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          </section>

          <section className="rounded-2xl border border-border bg-white p-6 shadow-sm">
            <h2 className="font-serif text-lg text-slate-900">Gesprekken</h2>
            <ul className="mt-4 space-y-3">
              {(gesprekken ?? []).length === 0 && (
                <li className="text-sm text-muted">Nog geen gesprekken.</li>
              )}
              {(gesprekken ?? []).map((g) => {
                const cnaam =
                  g.campagne_id ? campagneNaam[g.campagne_id] : undefined;
                return (
                  <li
                    key={g.id}
                    className="rounded-xl border border-border p-3 text-sm"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="font-medium">{cnaam ?? "Campagne"}</span>
                      <ScoreBadge score={g.score} />
                    </div>
                    <p className="text-xs text-muted">
                      {formatDateNl(g.aangemaakt_op)} · Duur{" "}
                      {g.duur_seconden ? `${g.duur_seconden}s` : "—"} ·{" "}
                      {g.aanbeveling ?? "—"}
                    </p>
                    {g.transcript && (
                      <details className="mt-2">
                        <summary className="cursor-pointer text-primary">
                          Transcript
                        </summary>
                        <pre className="mt-2 max-h-48 overflow-auto rounded-lg bg-slate-50 p-2 font-mono text-xs">
                          {g.transcript}
                        </pre>
                      </details>
                    )}
                  </li>
                );
              })}
            </ul>
          </section>
        </div>

        <div className="space-y-6 lg:col-span-2">
          <div className="rounded-2xl border border-border bg-white p-6 shadow-sm">
            <h2 className="font-serif text-lg text-slate-900">Snelle acties</h2>
            <div className="mt-4 space-y-3">
              <KandidaatActies
                kandidaatId={k.id}
                campagneId={latestCampagneId}
              />
              <Link
                href={`/berichten?kandidaat=${k.id}`}
                className="block w-full rounded-xl border border-border py-2 text-center text-sm font-medium hover:bg-slate-50"
              >
                WhatsApp sturen
              </Link>
              <Link
                href={`/kandidaten/${k.id}/bewerken`}
                className="block w-full rounded-xl border border-border py-2 text-center text-sm font-medium text-slate-800 hover:bg-slate-50"
              >
                Bewerken
              </Link>
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-white p-6 shadow-sm">
            <h2 className="font-serif text-lg text-slate-900">Statistieken</h2>
            <ul className="mt-3 space-y-2 text-sm">
              <li>Aantal gesprekken: {gesprekken?.length ?? 0}</li>
              <li>Gemiddelde score: {avg != null ? `${avg}/10` : "—"}</li>
              <li>
                Laatste contact:{" "}
                {k.laatste_contact ? timeAgoNl(k.laatste_contact) : "—"}
              </li>
              <li>Plaatsingen: {plaatsCount ?? 0}</li>
            </ul>
          </div>

          <div className="rounded-2xl border border-border bg-white p-6 shadow-sm">
            <h2 className="font-serif text-lg text-slate-900">
              WhatsApp-geschiedenis
            </h2>
            <ul className="mt-3 max-h-64 space-y-2 overflow-y-auto text-sm">
              {(berichten ?? []).map((b) => (
                <li
                  key={b.id}
                  className={`rounded-lg p-2 ${
                    b.richting === "inbound"
                      ? "ml-4 bg-green-50 text-slate-800"
                      : "mr-4 bg-slate-100 text-slate-800"
                  }`}
                >
                  <span className="text-xs text-muted">
                    {b.richting === "inbound" ? "Inkomend" : "Uitgaand"} ·{" "}
                    {formatDateNl(b.aangemaakt_op)}
                  </span>
                  <p className="mt-1 whitespace-pre-wrap">{b.inhoud}</p>
                </li>
              ))}
              {!berichten?.length && (
                <li className="text-muted">Geen berichten.</li>
              )}
            </ul>
            <Link
              href="/berichten"
              className="mt-3 inline-block text-sm text-primary hover:underline"
            >
              Bekijk alle berichten
            </Link>
          </div>

          <WhatsAppPanel kandidaatId={k.id} />
        </div>
      </div>
    </PageWrapper>
  );
}
