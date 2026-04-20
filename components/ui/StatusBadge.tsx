import { cn } from "@/lib/utils";

type BadgeStyle = {
  label: string;
  dot: string;
  text: string;
  bg: string;
  border: string;
};

const DEFAULT_UNKNOWN: Omit<BadgeStyle, "label"> = {
  dot: "#B0AFA9",
  text: "#8A8A85",
  bg: "#F5F4F0",
  border: "rgba(0,0,0,0.08)",
};

function styleFor(key: string): BadgeStyle {
  const k = key.toLowerCase();
  const map: Record<string, BadgeStyle> = {
    geschikt: {
      label: "Geschikt",
      dot: "#5C8A5C",
      text: "#1A5C2A",
      bg: "#D4EDD8",
      border: "rgba(26,92,42,0.15)",
    },
    niet_geschikt: {
      label: "Niet geschikt",
      dot: "#C05050",
      text: "#8B2020",
      bg: "#F5D9D9",
      border: "rgba(139,32,32,0.15)",
    },
    twijfel: {
      label: "Twijfel",
      dot: "#C8A45A",
      text: "#7A5C10",
      bg: "#F5EBC8",
      border: "rgba(122,92,16,0.15)",
    },
    geen_gehoor: {
      label: "Geen gehoor",
      dot: "#B0AFA9",
      text: "#8A8A85",
      bg: "#F5F4F0",
      border: "rgba(0,0,0,0.08)",
    },
    wacht: {
      label: "Wacht",
      dot: "#B0AFA9",
      text: "#1D4A7A",
      bg: "#D4E4F7",
      border: "rgba(29,74,122,0.15)",
    },
    actief: {
      label: "Actief",
      dot: "#5C8A5C",
      text: "#1A5C2A",
      bg: "#D4EDD8",
      border: "rgba(26,92,42,0.15)",
    },
    concept: {
      label: "Concept",
      dot: "#B0AFA9",
      text: "#8A8A85",
      bg: "#F5F4F0",
      border: "rgba(0,0,0,0.08)",
    },
    gepauzeerd: {
      label: "Gepauzeerd",
      dot: "#C8A45A",
      text: "#7A5C10",
      bg: "#F5EBC8",
      border: "rgba(122,92,16,0.15)",
    },
    afgerond: {
      label: "Afgerond",
      dot: "#8A8A85",
      text: "#8A8A85",
      bg: "#F5F4F0",
      border: "rgba(0,0,0,0.08)",
    },
    gestopt: {
      label: "Gestopt",
      dot: "#C05050",
      text: "#8B2020",
      bg: "#F5D9D9",
      border: "rgba(139,32,32,0.15)",
    },
    inactief: {
      label: "Inactief",
      dot: "#B0AFA9",
      text: "#8A8A85",
      bg: "#F5F4F0",
      border: "rgba(0,0,0,0.08)",
    },
    geplaatst: {
      label: "Geplaatst",
      dot: "#5C6B3A",
      text: "#3A4A20",
      bg: "#E4EDD4",
      border: "rgba(92,107,58,0.15)",
    },
    niet_beschikbaar: {
      label: "Niet beschikbaar",
      dot: "#C8A45A",
      text: "#7A5C10",
      bg: "#F5EBC8",
      border: "rgba(122,92,16,0.15)",
    },
    open: {
      label: "Open",
      dot: "#1D4A7A",
      text: "#1D4A7A",
      bg: "#D4E4F7",
      border: "rgba(29,74,122,0.15)",
    },
    bezig: {
      label: "Bezig",
      dot: "#C8A45A",
      text: "#7A5C10",
      bg: "#F5EBC8",
      border: "rgba(122,92,16,0.15)",
    },
    voltooid: {
      label: "Voltooid",
      dot: "#5C8A5C",
      text: "#1A5C2A",
      bg: "#D4EDD8",
      border: "rgba(26,92,42,0.15)",
    },
    bevestigd: {
      label: "Bevestigd",
      dot: "#5C8A5C",
      text: "#1A5C2A",
      bg: "#D4EDD8",
      border: "rgba(26,92,42,0.15)",
    },
    bevestigd_door_kandidaat: {
      label: "Bevestigd door kandidaat",
      dot: "#5C8A5C",
      text: "#1A5C2A",
      bg: "#D4EDD8",
      border: "rgba(26,92,42,0.15)",
    },
    beëindigd: {
      label: "Beëindigd",
      dot: "#8A8A85",
      text: "#8A8A85",
      bg: "#F5F4F0",
      border: "rgba(0,0,0,0.08)",
    },
    vast: {
      label: "vast",
      dot: "#C8A45A",
      text: "#7A5C10",
      bg: "#F5EBC8",
      border: "rgba(122,92,16,0.15)",
    },
  };
  return (
    map[k] ?? {
      label: key || "—",
      ...DEFAULT_UNKNOWN,
    }
  );
}

function normalizeKey(status: string | null | undefined): string {
  if (status == null) return "";
  const u = status.toUpperCase();
  if (u === "GESCHIKT") return "geschikt";
  if (u === "NIET_GESCHIKT") return "niet_geschikt";
  if (u === "TWIJFEL") return "twijfel";
  return status;
}

export function StatusBadge({ status }: { status: string | null | undefined }) {
  const raw = normalizeKey(status ?? "");
  const key = raw.toLowerCase().replace(/\s+/g, "_");
  const cfg = styleFor(key);

  return (
    <span
      className={cn(
        "inline-flex max-w-full items-center gap-[5px] rounded-full px-2 py-0.5 text-xs font-medium",
      )}
      style={{
        backgroundColor: cfg.bg,
        color: cfg.text,
        border: `1px solid ${cfg.border}`,
      }}
    >
      <span
        className="h-[5px] w-[5px] shrink-0 rounded-full"
        style={{ backgroundColor: cfg.dot }}
        aria-hidden
      />
      {cfg.label}
    </span>
  );
}
