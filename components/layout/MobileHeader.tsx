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
      <header className="fixed left-0 right-0 top-0 z-50 flex h-14 items-center justify-between border-b border-border bg-white px-4 md:hidden">
        <button
          type="button"
          className="rounded-lg p-2 text-slate-800 hover:bg-slate-100"
          aria-label="Menu openen"
          onClick={() => setOpen(true)}
        >
          ☰
        </button>
        <Link href="/dashboard" className="font-serif text-lg text-slate-900">
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
          <nav className="absolute left-0 top-0 flex h-full w-[min(100%,20rem)] flex-col bg-sidebar p-4 text-white shadow-xl">
            <div className="mb-6 flex items-center justify-between">
              <span className="font-serif text-xl">Menu</span>
              <button
                type="button"
                className="rounded-lg p-2 hover:bg-white/10"
                onClick={() => setOpen(false)}
              >
                ✕
              </button>
            </div>
            <ul className="space-y-1">
              {APP_NAV.map((item) => {
                const active =
                  pathname === item.href || pathname.startsWith(`${item.href}/`);
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={() => setOpen(false)}
                      className={cn(
                        "flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium",
                        active
                          ? "bg-white/10 text-white"
                          : "text-slate-300 hover:bg-white/5",
                      )}
                    >
                      {"emoji" in item ?
                        <span aria-hidden>{item.emoji}</span>
                      : <Zap className="h-4 w-4 shrink-0 text-amber-400" aria-hidden />}
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
