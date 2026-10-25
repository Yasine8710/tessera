import { TZDate } from "@date-fns/tz";

export type ScheduleInput = {
  timesOfDay: string[]; // "HH:mm" in the patient's local time
  daysOfWeek: number[]; // 0 (Sun) .. 6 (Sat); empty = every day
  startDate: string; // "YYYY-MM-DD" local
  endDate?: string | null; // inclusive
};

const TIME_RE = /^([01]\d|2[0-3]):([0-5]\d)$/;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export function isValidTime(t: string): boolean {
  return TIME_RE.test(t);
}

export function isValidTimeZone(tz: string): boolean {
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}

/** "YYYY-MM-DD" for an instant, in the given zone. */
export function localDateString(instant: Date, tz: string): string {
  const d = new TZDate(instant.getTime(), tz);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function addDaysToLocalDate(date: string, days: number): string {
  const [y, m, d] = date.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d + days));
  return `${dt.getUTCFullYear()}-${pad(dt.getUTCMonth() + 1)}-${pad(dt.getUTCDate())}`;
}

function weekday(date: string): number {
  const [y, m, d] = date.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay();
}

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

/** UTC instant of a local wall-clock time. Nonexistent times (DST gap) roll forward. */
export function localToInstant(date: string, time: string, tz: string): Date {
  const [y, m, d] = date.split("-").map(Number);
  const [hh, mm] = time.split(":").map(Number);
  return new Date(new TZDate(y, m - 1, d, hh, mm, 0, tz).getTime());
}

/**
 * Expand a schedule into scheduled dose instants within [from, to).
 * Day boundaries are evaluated in `tz`, so DST changes never shift or duplicate doses.
 */
export function expandSchedule(
  s: ScheduleInput,
  tz: string,
  from: Date,
  to: Date,
): Date[] {
  if (!DATE_RE.test(s.startDate)) throw new Error("Invalid startDate");
  if (s.endDate && !DATE_RE.test(s.endDate)) throw new Error("Invalid endDate");
  for (const t of s.timesOfDay) if (!isValidTime(t)) throw new Error(`Invalid time ${t}`);
  if (to <= from) return [];

  const out: Date[] = [];
  let day = addDaysToLocalDate(localDateString(from, tz), -1);
  const lastDay = addDaysToLocalDate(localDateString(to, tz), 1);
  let guard = 0;
  while (day <= lastDay && guard++ < 800) {
    const inPlan = day >= s.startDate && (!s.endDate || day <= s.endDate);
    const dayOk = s.daysOfWeek.length === 0 || s.daysOfWeek.includes(weekday(day));
    if (inPlan && dayOk) {
      for (const t of [...s.timesOfDay].sort()) {
        const at = localToInstant(day, t, tz);
        if (at >= from && at < to) out.push(at);
      }
    }
    day = addDaysToLocalDate(day, 1);
  }
  return out;
}
