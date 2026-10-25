/**
 * Pure date helpers for the patient portal. Everything is formatted in the viewer's
 * timezone (session.timezone) with a fixed locale so server and client output match.
 * No server-only or node imports: safe in client components.
 */
import { localToInstant } from "@/domain/schedule";

const LOCALE = "en-US";

const toDate = (d: Date | string) => (d instanceof Date ? d : new Date(d));

export const fmtDateTime = (d: Date | string, tz: string) =>
  new Intl.DateTimeFormat(LOCALE, { timeZone: tz, weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }).format(toDate(d));

export const fmtDateTimeYear = (d: Date | string, tz: string) =>
  new Intl.DateTimeFormat(LOCALE, { timeZone: tz, year: "numeric", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }).format(toDate(d));

export const fmtTime = (d: Date | string, tz: string) =>
  new Intl.DateTimeFormat(LOCALE, { timeZone: tz, hour: "numeric", minute: "2-digit" }).format(toDate(d));

export const fmtDay = (d: Date | string, tz: string) =>
  new Intl.DateTimeFormat(LOCALE, { timeZone: tz, weekday: "short", month: "short", day: "numeric" }).format(toDate(d));

export const fmtShortDay = (d: Date | string, tz: string) =>
  new Intl.DateTimeFormat(LOCALE, { timeZone: tz, month: "short", day: "numeric" }).format(toDate(d));

/** Calendar dates stored as `@db.Date` (UTC midnight) or "YYYY-MM-DD" strings: no timezone shift. */
export const fmtPlainDate = (d: Date | string) => {
  const v = typeof d === "string" && d.length === 10 ? new Date(`${d}T00:00:00.000Z`) : toDate(d);
  return new Intl.DateTimeFormat(LOCALE, { timeZone: "UTC", year: "numeric", month: "short", day: "numeric" }).format(v);
};

/** "Mon 3 Nov" style label for a local "YYYY-MM-DD" string. */
export const fmtLocalDateLabel = (date: string) =>
  new Intl.DateTimeFormat(LOCALE, { timeZone: "UTC", weekday: "short", month: "short", day: "numeric" }).format(new Date(`${date}T00:00:00.000Z`));

export const DAY_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;

export function describeDays(days: number[]): string {
  if (days.length === 0 || days.length === 7) return "Every day";
  return [...days].sort((a, b) => a - b).map((d) => DAY_SHORT[d]).join(", ");
}

/** Weekday (0 = Sunday) of a local "YYYY-MM-DD" date. */
export const weekdayOf = (date: string) => new Date(`${date}T00:00:00.000Z`).getUTCDay();

export const isScheduledOn = (days: number[], date: string) => days.length === 0 || days.includes(weekdayOf(date));

/** Value for <input type="datetime-local"> showing `instant` in `tz`. */
export function toLocalInput(instant: Date, tz: string): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: tz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(instant);
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "00";
  return `${get("year")}-${get("month")}-${get("day")}T${get("hour")}:${get("minute")}`;
}

/** Converts a datetime-local value, read as wall-clock time in `tz`, to an ISO string. */
export function localInputToIso(value: string, tz: string): string | undefined {
  const m = /^(\d{4}-\d{2}-\d{2})T(\d{2}:\d{2})/.exec(value);
  if (!m) return undefined;
  const d = localToInstant(m[1], m[2], tz);
  return Number.isNaN(d.getTime()) ? undefined : d.toISOString();
}

export const SELF_REPORT_NOTE = "Based on what you recorded; may be incomplete.";

export const MEASUREMENT_NAMES: Record<string, string> = {
  BLOOD_PRESSURE: "Blood pressure",
  WEIGHT: "Weight",
  GLUCOSE: "Blood glucose",
  HEART_RATE: "Heart rate",
  TEMPERATURE: "Temperature",
};

export const fmtMeasurement = (m: { value: number; value2: number | null; unit: string }) =>
  `${m.value2 != null ? `${m.value}/${m.value2}` : m.value} ${m.unit}`;
