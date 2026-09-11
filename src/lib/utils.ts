import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatRupiah(value: number | null | undefined) {
  const amount = Math.trunc(value ?? 0);
  const sign = amount < 0 ? "-" : "";
  return `${sign}Rp${Math.abs(amount).toLocaleString("id-ID")}`;
}

export function formatRupiahCompact(value: number | null | undefined) {
  const amount = value ?? 0;
  const sign = amount < 0 ? "-" : "";
  const abs = Math.abs(amount);
  if (abs >= 1_000_000_000) return `${sign}Rp${(abs / 1_000_000_000).toFixed(1).replace(".", ",")}m`;
  if (abs >= 1_000_000) return `${sign}Rp${(abs / 1_000_000).toFixed(1).replace(".", ",")}jt`;
  if (abs >= 1_000) return `${sign}Rp${(abs / 1_000).toFixed(0)}rb`;
  return formatRupiah(amount);
}

export const APP_TIME_ZONE = "Asia/Jakarta";

export function todayInApp(from = new Date()) {
  const stamp = new Intl.DateTimeFormat("en-CA", {
    timeZone: APP_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(from);
  return new Date(`${stamp}T00:00:00.000Z`);
}

export function toDateInput(value: Date | string | null | undefined) {
  if (!value) return "";
  const date = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 10);
}

export function startOfUtcDay(value: Date | string) {
  const date = typeof value === "string" ? new Date(value) : value;
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

export function daysUntil(target: Date | string, from = todayInApp()) {
  const a = startOfUtcDay(target).getTime();
  const b = startOfUtcDay(from).getTime();
  return Math.round((a - b) / 86_400_000);
}

export function formatLongDate(value: Date | string) {
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(typeof value === "string" ? new Date(value) : value);
}

export function formatShortDate(value: Date | string) {
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(typeof value === "string" ? new Date(value) : value);
}

export function slugify(input: string) {
  return input
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 48);
}

export function parseMoney(value: FormDataEntryValue | null) {
  const raw = String(value ?? "").replace(/[^\d-]/g, "");
  if (!raw) return 0;
  return Number.parseInt(raw, 10) || 0;
}

export function uniqueInviteSlug(a: string, b: string) {
  const base = slugify(`${a}-dan-${b}`) || "undangan";
  const suffix = Math.random().toString(36).slice(2, 6);
  return `${base}-${suffix}`;
}

export function formatAgendaHeading(value: Date | string) {
  return new Intl.DateTimeFormat("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  })
    .format(typeof value === "string" ? new Date(value) : value)
    .toUpperCase();
}

export function formatMonthYear(value: Date | string) {
  return new Intl.DateTimeFormat("id-ID", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(typeof value === "string" ? new Date(value) : value);
}

export function isoDate(value: Date | string) {
  return startOfUtcDay(value).toISOString().slice(0, 10);
}

export function minutesFromClock(time: string) {
  const match = time.trim().match(/^(\d{1,2}):(\d{2})/);
  if (!match) return 24 * 60;
  return Number(match[1]) * 60 + Number(match[2]);
}

export function addUtcMonths(value: Date, delta: number) {
  return new Date(Date.UTC(value.getUTCFullYear(), value.getUTCMonth() + delta, 1));
}
