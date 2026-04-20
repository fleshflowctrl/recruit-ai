"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const ITEMS = [
  { href: "/dashboard", label: "Home", emoji: "📊" },
  { href: "/kandidaten", label: "Kandidaten", emoji: "👥" },
  { href: "/campagnes", label: "Campagnes", emoji: "📞" },
  { href: "/instellingen", label: "Meer", emoji: "⚙️" },
];

export function MobileBottomNav() {
  const pathname = usePathname();
  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 flex justify-around border-t border-[color:var(--cream-border)] bg-[var(--cream-bg)] py-2 md:hidden"
      aria-label="Hoofdnavigatie"
    >
      {ITEMS.map((item) => {
        const active =
          pathname === item.href || pathname.startsWith(`${item.href}/`);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex flex-col items-center px-2 py-1 text-[10px] font-medium",
              active
                ? "text-[color:var(--cream-text)]"
                : "text-[color:var(--cream-muted)]",
            )}
          >
            <span className="text-lg opacity-90" aria-hidden>
              {item.emoji}
            </span>
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
