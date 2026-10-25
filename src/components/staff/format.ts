import { localToInstant } from "@/domain/schedule";

type D = Date | string;

/** Date and time in the viewer's timezone. */
export function fmtDateTime(d: D, tz: string) {
  return new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeStyle: "short", timeZone: tz }).format(new Date(d));
}

/** Calendar day of an instant, in the viewer's timezone. */
export function fmtDay(d: D, tz: string) {
  return new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeZone: tz }).format(new Date(d));
}

/** Date-only columns (@db.Date) are stored as UTC midnight: never shift them by timezone. */
export function fmtDateOnly(d: D) {
  return new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeZone: "UTC" }).format(new Date(d));
}

/** `datetime-local` value ("YYYY-MM-DDTHH:mm") read as wall-clock time in `tz` -> ISO instant. */
export function localInputToIso(value: string, tz: string): string | null {
  const [date, time] = value.split("T");
  if (!date || !time) return null;
  const d = localToInstant(date, time.slice(0, 5), tz);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

export const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function describeDays(days: number[]) {
  return days.length === 0 || days.length === 7 ? "Every day" : [...days].sort().map((d) => DAY_NAMES[d]).join(", ");
}

export const CONSENT_LABEL: Record<string, string> = {
  JOURNAL: "Journal",
  MEASUREMENTS: "Measurements",
  ROUTINES: "Routines",
  MEDICATION_ADHERENCE: "Medication adherence",
};

export const MEASUREMENT_LABEL: Record<string, string> = {
  BLOOD_PRESSURE: "Blood pressure",
  WEIGHT: "Weight",
  GLUCOSE: "Glucose",
  HEART_RATE: "Heart rate",
  TEMPERATURE: "Temperature",
};

export const APPT_LABEL: Record<string, string> = {
  REQUESTED: "Requested",
  CONFIRMED: "Confirmed",
  RESCHEDULE_REQUESTED: "Reschedule requested",
  CANCEL_REQUESTED: "Cancellation requested",
  CANCELLED: "Cancelled",
  COMPLETED: "Completed",
  NO_SHOW: "No-show",
};

export const ROUTINE_KIND_LABEL: Record<string, string> = {
  HYDRATION: "Hydration",
  ACTIVITY: "Activity",
  SLEEP: "Sleep",
  EXERCISE: "Exercise",
  WELLNESS: "Wellness",
  CLINICIAN_TASK: "Clinician task",
};

export const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);
