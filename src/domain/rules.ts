// ---------- Medication intake ----------
export type IntakeStatus = "SCHEDULED" | "TAKEN" | "SKIPPED" | "MISSED";

/** Grace period after which an unreported dose counts as MISSED. */
export const MISSED_AFTER_MINUTES = 120;

export function effectiveIntakeStatus(
  stored: IntakeStatus,
  scheduledFor: Date,
  now: Date,
): IntakeStatus {
  if (stored !== "SCHEDULED") return stored;
  const cutoff = scheduledFor.getTime() + MISSED_AFTER_MINUTES * 60_000;
  return now.getTime() > cutoff ? "MISSED" : "SCHEDULED";
}

/** Patient-reported outcomes only. MISSED is never reported by a patient directly. */
export const REPORTABLE: IntakeStatus[] = ["TAKEN", "SKIPPED"];

export function canReportIntake(
  current: IntakeStatus,
  next: IntakeStatus,
  scheduledFor: Date,
  now: Date,
): { ok: true } | { ok: false; reason: string } {
  if (!REPORTABLE.includes(next)) return { ok: false, reason: "Only taken or skipped can be reported." };
  if (scheduledFor.getTime() > now.getTime() + 60 * 60_000)
    return { ok: false, reason: "This dose is not due yet." };
  if (scheduledFor.getTime() < now.getTime() - 14 * 24 * 3600_000)
    return { ok: false, reason: "Entries older than 14 days cannot be edited." };
  if (current === next) return { ok: true };
  return { ok: true };
}

export function adherenceRate(counts: { taken: number; skipped: number; missed: number }) {
  const due = counts.taken + counts.skipped + counts.missed;
  return due === 0 ? null : Math.round((counts.taken / due) * 100);
}

// ---------- Appointments ----------
export type AppointmentStatus =
  | "REQUESTED"
  | "CONFIRMED"
  | "RESCHEDULE_REQUESTED"
  | "CANCEL_REQUESTED"
  | "CANCELLED"
  | "COMPLETED"
  | "NO_SHOW";

const APPT_TRANSITIONS: Record<AppointmentStatus, AppointmentStatus[]> = {
  REQUESTED: ["CONFIRMED", "CANCELLED"],
  CONFIRMED: ["CONFIRMED", "RESCHEDULE_REQUESTED", "CANCEL_REQUESTED", "CANCELLED", "COMPLETED", "NO_SHOW"],
  RESCHEDULE_REQUESTED: ["CONFIRMED", "CANCELLED"],
  CANCEL_REQUESTED: ["CANCELLED", "CONFIRMED"],
  CANCELLED: [],
  COMPLETED: [],
  NO_SHOW: [],
};

export function canTransitionAppointment(from: AppointmentStatus, to: AppointmentStatus): boolean {
  return APPT_TRANSITIONS[from].includes(to);
}

/** Statuses only staff may set. */
export const STAFF_ONLY_APPT: AppointmentStatus[] = ["CONFIRMED", "COMPLETED", "NO_SHOW", "CANCELLED"];

// ---------- Invitations ----------
export type InvitationLike = {
  status: "PENDING" | "ACCEPTED" | "DECLINED" | "REVOKED";
  expiresAt: Date;
  usedAt: Date | null;
};

export function invitationUsable(inv: InvitationLike, now: Date): boolean {
  return inv.status === "PENDING" && inv.usedAt === null && inv.expiresAt.getTime() > now.getTime();
}

export const INVITATION_TTL_DAYS = 7;

// ---------- Care-plan versioning ----------
export type PlanSnapshot = {
  title: string;
  instructions: string;
  startDate: string;
  endDate: string | null;
};

export function planChanged(a: PlanSnapshot, b: PlanSnapshot): boolean {
  return (
    a.title !== b.title ||
    a.instructions !== b.instructions ||
    a.startDate !== b.startDate ||
    a.endDate !== b.endDate
  );
}

// ---------- Notifications ----------
/** Deterministic key: retried jobs produce the same key, so a unique index dedupes them. */
export function dedupeKey(type: string, ...parts: (string | number | Date)[]): string {
  return [type, ...parts.map((p) => (p instanceof Date ? p.toISOString() : String(p)))].join("|");
}

// ---------- Measurements ----------
export const MEASUREMENT_LIMITS = {
  BLOOD_PRESSURE: { unit: "mmHg", min: 40, max: 300, min2: 20, max2: 200 },
  WEIGHT: { unit: "kg", min: 2, max: 500 },
  GLUCOSE: { unit: "mg/dL", min: 10, max: 1000 },
  HEART_RATE: { unit: "bpm", min: 20, max: 300 },
  TEMPERATURE: { unit: "°C", min: 30, max: 45 },
} as const;

export function validateMeasurement(
  type: keyof typeof MEASUREMENT_LIMITS,
  value: number,
  value2?: number | null,
): string | null {
  const l = MEASUREMENT_LIMITS[type] as { min: number; max: number; min2?: number; max2?: number };
  if (!Number.isFinite(value) || value < l.min || value > l.max)
    return `Value must be between ${l.min} and ${l.max}.`;
  if (type === "BLOOD_PRESSURE") {
    if (value2 == null || !Number.isFinite(value2) || value2 < l.min2! || value2 > l.max2!)
      return `Diastolic must be between ${l.min2} and ${l.max2}.`;
    if (value2 >= value) return "Systolic must be higher than diastolic.";
  }
  return null;
}

// ---------- Streaks ----------
/** Consecutive completed local dates ending today (or yesterday, if today is not done yet). */
export function currentStreak(completedDates: string[], today: string, prev: (d: string) => string): number {
  const set = new Set(completedDates);
  let cursor = set.has(today) ? today : prev(today);
  let n = 0;
  while (set.has(cursor)) {
    n++;
    cursor = prev(cursor);
  }
  return n;
}
