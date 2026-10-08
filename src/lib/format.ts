import { format, formatDistanceToNowStrict, type Locale } from "date-fns";

export function formatDate(iso: string, locale: Locale, pattern = "d MMM yyyy"): string {
  return format(new Date(iso), pattern, { locale });
}

export function formatDateTime(iso: string, locale: Locale): string {
  return format(new Date(iso), "d MMM yyyy, HH:mm", { locale });
}

export function formatRelative(iso: string, locale: Locale): string {
  return formatDistanceToNowStrict(new Date(iso), { locale, addSuffix: true });
}

export function compactNumber(value: number, lang: string): string {
  return new Intl.NumberFormat(lang === "id" ? "id-ID" : "en-US", { notation: value >= 10_000 ? "compact" : "standard", maximumFractionDigits: 1 }).format(value);
}
