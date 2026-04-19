export const CAMPAGNE_TYPES = [
  {
    id: "prescreening",
    label: "Prescreening",
    emoji: "📞",
    beschrijving: "Nieuwe kandidaten screenen",
  },
  {
    id: "beschikbaarheid",
    label: "Beschikbaarheid check",
    emoji: "📋",
    beschrijving: "Beschikbaarheid controleren",
  },
  {
    id: "no_show",
    label: "No-show preventie",
    emoji: "✅",
    beschrijving: "Voorkomen van no-shows",
  },
  {
    id: "check_in",
    label: "Check-in tijdens plaatsing",
    emoji: "🤝",
    beschrijving: "Tussentijdse check-in",
  },
  {
    id: "evaluatie",
    label: "Evaluatie na plaatsing",
    emoji: "⭐",
    beschrijving: "Evaluatie na plaatsing",
  },
] as const;

export const DEFAULT_SCREENING_VRAGEN = [
  "Kunt u kort uw werkervaring beschrijven?",
  "Bent u per direct beschikbaar of heeft u een opzegtermijn?",
  "Wat zijn uw salariswensen?",
  "Beschikt u over een rijbewijs?",
  "Waarom bent u op zoek naar een nieuwe baan?",
];

export const STRIPE_PLANS = [
  {
    id: "starter",
    naam: "Starter",
    prijs: 199,
    calls: 100,
    price_env: "NEXT_PUBLIC_STRIPE_PRICE_STARTER",
  },
  {
    id: "professional",
    naam: "Professional",
    prijs: 399,
    calls: 300,
    price_env: "NEXT_PUBLIC_STRIPE_PRICE_PROFESSIONAL",
  },
  {
    id: "enterprise",
    naam: "Enterprise",
    prijs: 799,
    calls: null as number | null,
    price_env: "NEXT_PUBLIC_STRIPE_PRICE_ENTERPRISE",
  },
] as const;
