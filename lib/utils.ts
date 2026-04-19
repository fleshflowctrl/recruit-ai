import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, formatDistanceToNow } from "date-fns";
import { nl } from "date-fns/locale";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Formatteer Nederlands telefoonnummer voor weergave */
export function formatPhoneNl(raw: string | null | undefined): string {
  if (!raw) return "—";
  const digits = raw.replace(/\D/g, "");
  if (digits.startsWith("31") && digits.length >= 11) {
    const rest = digits.slice(2);
    return `+31 ${rest.slice(0, 1)} ${rest.slice(1, 4)} ${rest.slice(4, 7)} ${rest.slice(7)}`.trim();
  }
  if (digits.length === 10 && digits.startsWith("0")) {
    return `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6)}`;
  }
  return raw;
}

export function formatEuro(min?: number | null, max?: number | null): string {
  if (min == null && max == null) return "—";
  if (min != null && max != null) return `€${min.toLocaleString("nl-NL")} - €${max.toLocaleString("nl-NL")}`;
  if (min != null) return `vanaf €${min.toLocaleString("nl-NL")}`;
  return `tot €${max!.toLocaleString("nl-NL")}`;
}

export function formatDateNl(iso: string | null | undefined): string {
  if (!iso) return "—";
  try {
    return format(new Date(iso), "d MMMM yyyy", { locale: nl });
  } catch {
    return iso;
  }
}

export function timeAgoNl(iso: string | null | undefined): string {
  if (!iso) return "—";
  try {
    return formatDistanceToNow(new Date(iso), { addSuffix: true, locale: nl });
  } catch {
    return "—";
  }
}

export function parseJsonSafe<T>(text: string, fallback: T): T {
  try {
    return JSON.parse(text) as T;
  } catch {
    return fallback;
  }
}
