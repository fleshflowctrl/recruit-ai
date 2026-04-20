"use client";

import Link from "next/link";
import { useState } from "react";
import { usePathname } from "next/navigation";
import { Zap } from "lucide-react";
import { APP_NAV } from "@/lib/nav";
import { cn } from "@/lib/utils";

export function MobileHeader() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  return (
    <>
      <header className="fixed left-0 right-0 top-0 z-50 flex h-14 items-center justify-between border-b border-[color:var(--cream-border)] bg-[var(--cream-bg)] px-4 md:hidden">
        <button
          type="button"
          className="rounded-md border border-[color:var(--cream-border)] p-2 text-[color:var(--cream-text)] transition-colors hover:bg-[color:var(--cream-surface)]"
          aria-label="Menu openen"
          onClick={() => setOpen(true)}
        >
          ☰
        </button>
        <Link
          href="/dashboard"
          className="text-[15px] font-semibold tracking-[0.02em] text-[color:var(--cream-text)]"
        >
          RecruitAI
        </Link>
        <span className="w-10" />
      </header>

      {open && (
        <div
          className="fixed inset-0 z-[60] md:hidden"
          role="dialog"
          aria-modal="true"
        >
          <button
            type="button"
            className="absolute inset-0 bg-black/40"
            aria-label="Menu sluiten"
            onClick={() => setOpen(false)}
          />
          <nav className="absolute left-0 top-0 flex h-full w-[min(100%,220px)] flex-col border-r border-[rgba(255,255,255,0.06)] bg-sidebar p-4 text-white">
            <div className="mb-6 flex items-center justify-between">
              <span className="text-[14px] font-semibold tracking-[0.02em] text-[#F5F4F0]">
                Menu
              </span>
              <button
                type="button"
                className="rounded-md p-2 hover:bg-[rgba(255,255,255,0.08)]"
                onClick={() => setOpen(false)}
              >
                ✕
              </button>
            </div>
            <ul className="space-y-0">
              {APP_NAV.map((item) => {
                const active =
                  pathname === item.href ||
                  pathname.startsWith(`${item.href}/`);
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={() => setOpen(false)}
                      className={cn(
                        "flex items-center gap-2 border-l-2 py-[7px] pl-4 pr-2 text-[13px] transition-all duration-[120ms]",
                        active
                          ? "border-[#C8B97A] bg-[rgba(255,255,255,0.08)] text-[#F5F4F0]"
                          : "border-transparent text-[rgba(255,255,255,0.45)] hover:bg-[rgba(255,255,255,0.05)] hover:text-[rgba(255,255,255,0.75)]",
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
                  </li>
                );
              })}
            </ul>
          </nav>
        </div>
      )}
    </>
  );
}
