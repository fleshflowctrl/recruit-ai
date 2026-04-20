"use client";

import Link from "next/link";

export type LiveHeroProps = {
  campagneNaam: string;
  gestart: string;
  verwachtKlaar: string;
  actieveCalls: Array<{ naam: string; duur: string }>;
  gebeldVandaag: number;
  isActive: boolean;
};

export function LiveHero({
  campagneNaam,
  gestart,
  verwachtKlaar,
  actieveCalls,
  gebeldVandaag,
  isActive,
}: LiveHeroProps) {
  if (!isActive) {
    return (
      <div className="mb-5 rounded-[14px] bg-[#1A1A18] px-5 py-6">
        <p className="text-[16px] font-medium text-[#F5F4F0]">
          Geen actieve campagnes
        </p>
        <p className="mt-1 text-[13px] text-[rgba(245,244,240,0.45)]">
          Start een nieuwe campagne om te beginnen
        </p>
        <Link
          href="/campagnes/nieuw"
          className="btn-primary mt-4 inline-flex"
        >
          Nieuwe campagne starten
        </Link>
      </div>
    );
  }

  const title =
    campagneNaam.trim().length > 0
      ? `${campagneNaam} is actief`
      : "Campagne is actief";

  return (
    <div className="relative mb-5 grid grid-cols-1 gap-5 overflow-hidden rounded-[14px] bg-[#1A1A18] p-5 lg:grid-cols-[1fr_auto] lg:items-center lg:gap-6 lg:p-7">
      <div
        className="pointer-events-none absolute -right-10 -top-10 h-[180px] w-[180px] rounded-full bg-[rgba(200,180,100,0.06)]"
        aria-hidden
      />

      <div className="relative z-[1] min-w-0">
        <div
          className="mb-3.5 inline-flex w-fit items-center gap-1.5 rounded-[20px] border border-[rgba(200,180,100,0.25)] px-3 py-1"
        >
          <span
            className="live-hero-pulse-dot h-1.5 w-1.5 shrink-0 rounded-full bg-[#C8B47A]"
          />
          <span className="text-[11px] font-medium uppercase tracking-[0.06em] text-[#C8B47A]">
            LIVE — AI AAN HET BELLEN
          </span>
        </div>
        <h2 className="mb-1.5 text-[18px] font-medium leading-snug text-[#F5F4F0]">
          {title}
        </h2>
        <p className="text-[13px] text-[rgba(245,244,240,0.4)]">
          Gestart om {gestart} · Verwacht klaar om {verwachtKlaar}
        </p>
        {actieveCalls.length > 0 && (
          <ul className="mt-4 list-none p-0">
            {actieveCalls.map((call, i) => (
              <li
                key={`${call.naam}-${call.duur}-${i}`}
                className="mb-1.5 flex items-center gap-2.5 last:mb-0"
              >
                <span
                  className="live-call-pulse-dot h-1.5 w-1.5 shrink-0 rounded-full bg-[#5C8A5C]"
                  style={{
                    animationDelay: `${i === 0 ? 0 : i === 1 ? 0.4 : 0.8}s`,
                  }}
                />
                <span className="text-[13px] text-[rgba(245,244,240,0.75)]">
                  {call.naam}
                </span>
                <span className="ml-1.5 font-mono text-[12px] text-[rgba(245,244,240,0.3)]">
                  {call.duur}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="relative z-[1] shrink-0 text-left lg:text-right">
        <p
          className="text-[56px] font-normal leading-none tracking-[-2px] text-[#F5F4F0]"
          style={{ fontFamily: "ui-monospace, monospace" }}
        >
          {gebeldVandaag}
        </p>
        <p className="mt-1 text-[12px] text-[rgba(245,244,240,0.35)]">
          Gebeld vandaag
        </p>
      </div>
    </div>
  );
}
