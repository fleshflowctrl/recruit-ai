"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import type { Bureau, Profile } from "@/lib/types";

const NAV = [
  { href: "/dashboard", label: "Dashboard", emoji: "📊" },
  { href: "/kandidaten", label: "Kandidaten", emoji: "👥" },
  { href: "/opdrachtgevers", label: "Opdrachtgevers", emoji: "🏢" },
  { href: "/vacatures", label: "Vacatures", emoji: "💼" },
  { href: "/campagnes", label: "Campagnes", emoji: "📞" },
  { href: "/plaatsingen", label: "Plaatsingen", emoji: "✅" },
  { href: "/berichten", label: "Berichten", emoji: "💬" },
  { href: "/instellingen", label: "Instellingen", emoji: "⚙️" },
];

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
  const supabase = createClient();

  async function handleLogout() {
    await supabase.auth.signOut();
    window.location.href = "/login";
  }

  return (
    <>
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col border-r border-slate-800 bg-sidebar text-white lg:flex">
        <div className="flex h-16 items-center border-b border-slate-800 px-6">
          <Link href="/dashboard" className="font-serif text-xl text-white">
            RecruitAI
          </Link>
        </div>
        <nav className="flex-1 space-y-1 overflow-y-auto p-4">
          {NAV.map((item) => {
            const active =
              pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium transition-colors",
                  active
                    ? "bg-white/10 text-white"
                    : "text-slate-300 hover:bg-white/5 hover:text-white",
                )}
              >
                <span aria-hidden>{item.emoji}</span>
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-slate-800 p-4 text-sm">
          <p className="truncate font-medium text-white">{bureau.naam}</p>
          <p className="mt-1 inline-flex rounded-full bg-white/10 px-2 py-0.5 text-xs text-slate-200">
            {planLabel(bureau.plan)}
          </p>
          <p className="mt-3 text-slate-400">
            Credits:{" "}
            <span
              className={cn(
                "font-semibold text-white",
                bureau.credits_resterend < 20 && "text-warning",
              )}
            >
              {bureau.credits_resterend}
            </span>{" "}
            resterend
          </p>
          {profile.volledige_naam && (
            <p className="mt-2 truncate text-xs text-slate-500">
              {profile.volledige_naam}
            </p>
          )}
          <button
            type="button"
            onClick={handleLogout}
            className="mt-4 w-full rounded-xl border border-slate-600 py-2 text-center text-sm font-medium text-slate-200 hover:bg-white/5"
          >
            Uitloggen
          </button>
        </div>
      </aside>
      <div className="h-14 border-b border-border bg-white lg:hidden" />
    </>
  );
}
