export const APP_NAV = [
  { href: "/dashboard", label: "Dashboard", emoji: "📊" },
  { href: "/kandidaten", label: "Kandidaten", emoji: "👥" },
  { href: "/opdrachtgevers", label: "Opdrachtgevers", emoji: "🏢" },
  { href: "/vacatures", label: "Vacatures", emoji: "💼" },
  { href: "/plaatsingen", label: "Plaatsingen", emoji: "✅" },
  { href: "/berichten", label: "Berichten", emoji: "💬" },
  {
    href: "/automatisering",
    label: "Automatisering",
    icon: "zap" as const,
  },
  { href: "/instellingen", label: "Instellingen", emoji: "⚙️" },
] as const;
