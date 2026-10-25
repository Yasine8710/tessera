import { describe, expect, it } from "vitest";
import {
  addDaysToLocalDate,
  expandSchedule,
  localDateString,
} from "@/domain/schedule";
import {
  adherenceRate,
  canReportIntake,
  canTransitionAppointment,
  currentStreak,
  dedupeKey,
  effectiveIntakeStatus,
  invitationUsable,
  planChanged,
  validateMeasurement,
} from "@/domain/rules";

describe("schedule expansion", () => {
  const base = { timesOfDay: ["08:00", "20:00"], daysOfWeek: [], startDate: "2026-03-01" };

  it("expands two daily doses in a zone", () => {
    const from = new Date("2026-03-02T00:00:00Z");
    const to = new Date("2026-03-03T00:00:00Z");
    const out = expandSchedule(base, "UTC", from, to);
    expect(out.map((d) => d.toISOString())).toEqual([
      "2026-03-02T08:00:00.000Z",
      "2026-03-02T20:00:00.000Z",
    ]);
  });

  it("keeps local wall time across US DST start (no duplicate, no shift)", () => {
    const from = new Date("2026-03-07T00:00:00Z");
    const to = new Date("2026-03-10T00:00:00Z");
    const out = expandSchedule({ ...base, timesOfDay: ["08:00"] }, "America/New_York", from, to);
    expect(out.map((d) => d.toISOString())).toEqual([
      "2026-03-07T13:00:00.000Z", // EST
      "2026-03-08T12:00:00.000Z", // EDT after spring-forward
      "2026-03-09T12:00:00.000Z",
    ]);
  });

  it("respects weekday filter and end date", () => {
    const s = { ...base, timesOfDay: ["09:00"], daysOfWeek: [1], endDate: "2026-03-09" };
    const out = expandSchedule(s, "UTC", new Date("2026-03-01T00:00:00Z"), new Date("2026-03-31T00:00:00Z"));
    expect(out.map((d) => d.toISOString().slice(0, 10))).toEqual(["2026-03-02", "2026-03-09"]);
  });

  it("rejects bad time", () => {
    expect(() => expandSchedule({ ...base, timesOfDay: ["25:00"] }, "UTC", new Date(0), new Date(1e9))).toThrow();
  });

  it("local date helpers", () => {
    expect(localDateString(new Date("2026-03-02T02:00:00Z"), "America/New_York")).toBe("2026-03-01");
    expect(addDaysToLocalDate("2026-02-28", 1)).toBe("2026-03-01");
  });
});

describe("intake rules", () => {
  const sched = new Date("2026-03-02T08:00:00Z");
  it("becomes MISSED after grace period only", () => {
    expect(effectiveIntakeStatus("SCHEDULED", sched, new Date("2026-03-02T09:00:00Z"))).toBe("SCHEDULED");
    expect(effectiveIntakeStatus("SCHEDULED", sched, new Date("2026-03-02T10:01:00Z"))).toBe("MISSED");
    expect(effectiveIntakeStatus("TAKEN", sched, new Date("2026-03-09T10:01:00Z"))).toBe("TAKEN");
  });
  it("patient cannot self-report MISSED or future doses", () => {
    const now = new Date("2026-03-02T09:00:00Z");
    expect(canReportIntake("SCHEDULED", "MISSED", sched, now).ok).toBe(false);
    expect(canReportIntake("SCHEDULED", "TAKEN", new Date("2026-03-02T20:00:00Z"), now).ok).toBe(false);
    expect(canReportIntake("SCHEDULED", "TAKEN", sched, now).ok).toBe(true);
    expect(canReportIntake("SCHEDULED", "TAKEN", new Date("2026-02-01T08:00:00Z"), now).ok).toBe(false);
  });
  it("adherence", () => {
    expect(adherenceRate({ taken: 0, skipped: 0, missed: 0 })).toBeNull();
    expect(adherenceRate({ taken: 3, skipped: 1, missed: 0 })).toBe(75);
  });
});

describe("appointment transitions", () => {
  it("allows and blocks", () => {
    expect(canTransitionAppointment("REQUESTED", "CONFIRMED")).toBe(true);
    expect(canTransitionAppointment("REQUESTED", "COMPLETED")).toBe(false);
    expect(canTransitionAppointment("CANCELLED", "CONFIRMED")).toBe(false);
    expect(canTransitionAppointment("CONFIRMED", "RESCHEDULE_REQUESTED")).toBe(true);
  });
});

describe("invitations", () => {
  const now = new Date("2026-03-02T00:00:00Z");
  const future = new Date("2026-03-05T00:00:00Z");
  it("usable only when pending, unused, unexpired", () => {
    expect(invitationUsable({ status: "PENDING", expiresAt: future, usedAt: null }, now)).toBe(true);
    expect(invitationUsable({ status: "PENDING", expiresAt: new Date("2026-03-01T00:00:00Z"), usedAt: null }, now)).toBe(false);
    expect(invitationUsable({ status: "ACCEPTED", expiresAt: future, usedAt: now }, now)).toBe(false);
    expect(invitationUsable({ status: "REVOKED", expiresAt: future, usedAt: null }, now)).toBe(false);
  });
});

describe("care plan + notifications + measurements + streaks", () => {
  it("detects plan changes", () => {
    const a = { title: "A", instructions: "x", startDate: "2026-01-01", endDate: null };
    expect(planChanged(a, { ...a })).toBe(false);
    expect(planChanged(a, { ...a, instructions: "y" })).toBe(true);
  });
  it("dedupe key is deterministic", () => {
    const d = new Date("2026-03-02T08:00:00Z");
    expect(dedupeKey("DOSE_DUE", "p1", d)).toBe(dedupeKey("DOSE_DUE", "p1", new Date(d)));
    expect(dedupeKey("DOSE_DUE", "p1", d)).not.toBe(dedupeKey("DOSE_DUE", "p2", d));
  });
  it("validates measurements", () => {
    expect(validateMeasurement("BLOOD_PRESSURE", 120, 80)).toBeNull();
    expect(validateMeasurement("BLOOD_PRESSURE", 80, 120)).not.toBeNull();
    expect(validateMeasurement("BLOOD_PRESSURE", 120)).not.toBeNull();
    expect(validateMeasurement("WEIGHT", 1000)).not.toBeNull();
    expect(validateMeasurement("GLUCOSE", 95)).toBeNull();
  });
  it("streaks", () => {
    const prev = (d: string) => addDaysToLocalDate(d, -1);
    expect(currentStreak(["2026-03-01", "2026-03-02", "2026-03-03"], "2026-03-03", prev)).toBe(3);
    expect(currentStreak(["2026-03-01", "2026-03-02"], "2026-03-03", prev)).toBe(2);
    expect(currentStreak(["2026-03-01"], "2026-03-03", prev)).toBe(0);
  });
});
