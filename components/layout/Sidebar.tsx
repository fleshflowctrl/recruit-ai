"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Bureau, Profile } from "@/lib/types";
import { APP_NAV } from "@/lib/nav";

function planLabel(plan: string) {
  const p = plan.toLowerCase();
  if (p === "trial") return "Proef";
  if (p === "starter") return "Starter";
  if (p === "professional") return "Professional";
  if (p === "enterprise") return "Enterprise";
  return plan;
}

export function Sidebar({
  bureau,
  profile,
}: {
  bureau: Bureau;
  profile: Profile;
}) {
  const pathname = usePathname();

  const credits = bureau.credits_resterend;
  const creditsBarPct = Math.min(100, (credits / 200) * 100);

  return (
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-[220px] flex-col border-r border-[rgba(255,255,255,0.06)] bg-sidebar text-white md:flex">
      <div className="shrink-0 border-b border-[rgba(255,255,255,0.06)] px-4 py-4">
        <Link
          href="/dashboard"
          className="block text-[14px] font-semibold tracking-[0.02em] text-[#F5F4F0]"
        >
          RecruitAI
        </Link>
        <p className="mt-1 truncate text-[11px] text-[rgba(255,255,255,0.35)]">
          {bureau.naam}
        </p>
      </div>
      <nav className="flex-1 space-y-0 overflow-y-auto py-3">
        {APP_NAV.map((item) => {
          const active =
            pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-2 border-l-2 py-[7px] pl-4 pr-4 text-[13px] transition-all duration-[120ms]",
                active
                  ? "border-[#C8B97A] bg-[rgba(255,255,255,0.08)] text-[#F5F4F0]"
                  : "border-transparent bg-transparent text-[rgba(255,255,255,0.45)] hover:bg-[rgba(255,255,255,0.05)] hover:text-[rgba(255,255,255,0.75)]",
              )}
            >
              {"emoji" in item ?
                <span aria-hidden className="text-[15px] leading-none">
                  {item.emoji}
                </span>
              : <Zap
                  className="h-[15px] w-[15px] shrink-0 text-[#C8B97A]"
                  strokeWidth={1.5}
                  aria-hidden
                />}
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="shrink-0 space-y-3 border-t border-[rgba(255,255,255,0.06)] p-4">
        <div>
          <div className="mb-1 flex items-center justify-between text-[11px] text-[rgba(255,255,255,0.35)]">
            <span>Credits resterend</span>
            <span
              className={cn(
                "font-medium text-[#F5F4F0]",
                credits < 20 && "text-[#E8C96C]",
              )}
            >
              {credits}
            </span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-[rgba(255,255,255,0.1)]">
            <div
              className="h-full rounded-full bg-[#C8B97A] transition-[width] duration-300"
              style={{ width: `${creditsBarPct}%` }}
            />
          </div>
        </div>
        <p className="inline-flex rounded-full bg-[rgba(255,255,255,0.08)] px-2 py-0.5 text-[11px] text-[rgba(255,255,255,0.75)]">
          {planLabel(bureau.plan)}
        </p>
        {profile.volledige_naam && (
          <p className="truncate text-[11px] text-[rgba(255,255,255,0.35)]">
            {profile.volledige_naam}
          </p>
        )}
      </div>
    </aside>
  );
}
