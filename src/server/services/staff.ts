import { adherenceRate, dedupeKey, effectiveIntakeStatus } from "@/domain/rules";
import { addDaysToLocalDate, localDateString } from "@/domain/schedule";
import { noteSchema, taskSchema } from "@/lib/schemas";
import { type Actor, assertPatientAccess, consentedPatientIds, requireProfessional } from "../access";
import { audit } from "../audit";
import { db } from "../db";
import { forbidden, notFound } from "../errors";
import { notify } from "./notifications";

export const STALE_DAYS_DEFAULT = 3;

// ---------------- Adherence ----------------

export type Adherence = { taken: number; skipped: number; missed: number; scheduled: number; rate: number | null };

async function adherenceRows(patientIds: string[], from: Date, to: Date, now: Date) {
  const rows = await db.medicationIntake.findMany({
    where: { plan: { patientId: { in: patientIds } }, scheduledFor: { gte: from, lt: to } },
    select: { status: true, scheduledFor: true, plan: { select: { patientId: true, medication: { select: { name: true } } } } },
  });
  return rows.map((r) => ({ ...r, eff: effectiveIntakeStatus(r.status, r.scheduledFor, now) }));
}

function tally(rows: { eff: string }[]): Adherence {
  const c = { taken: 0, skipped: 0, missed: 0, scheduled: 0 };
  for (const r of rows) {
    if (r.eff === "TAKEN") c.taken++;
    else if (r.eff === "SKIPPED") c.skipped++;
    else if (r.eff === "MISSED") c.missed++;
    else c.scheduled++;
  }
  return { ...c, rate: adherenceRate(c) };
}

/** Daily series + totals. Patients see their own; staff need MEDICATION_ADHERENCE consent. */
export async function adherenceReport(actor: Actor, patientId: string, days: number, now = new Date()) {
  await assertPatientAccess(actor, patientId, actor.role === "PROFESSIONAL" ? "MEDICATION_ADHERENCE" : undefined);
  const tz = actor.timezone;
  const from = new Date(now.getTime() - days * 86400_000);
  const rows = await adherenceRows([patientId], from, new Date(now.getTime() + 1), now);
  const byDay = new Map<string, typeof rows>();
  for (const r of rows) {
    const d = localDateString(r.scheduledFor, tz);
    byDay.set(d, [...(byDay.get(d) ?? []), r]);
  }
  const series = [...byDay.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([date, rs]) => ({ date, ...tally(rs) }));
  return { totals: tally(rows), series, exceptions: rows.filter((r) => r.eff === "MISSED" || r.eff === "SKIPPED").length };
}

// ---------------- Tasks + notes ----------------

export async function createTask(actor: Actor, raw: unknown) {
  const professionalId = requireProfessional(actor);
  const i = taskSchema.parse(raw);
  await assertPatientAccess(actor, i.patientId);
  const assigneeId = i.assigneeId ?? professionalId;
  if (assigneeId !== professionalId) {
    // May only assign to a professional who is also on this patient's care team.
    const rel = await db.careRelationship.findFirst({ where: { patientId: i.patientId, professionalId: assigneeId, status: "ACTIVE" } });
    if (!rel) throw forbidden("That colleague is not on this patient's care team.");
  }
  const t = await db.followUpTask.create({
    data: { patientId: i.patientId, createdById: professionalId, assigneeId, title: i.title, dueAt: new Date(i.dueAt) },
  });
  await audit(actor.userId, "task.create", "FollowUpTask", t.id);
  if (assigneeId !== professionalId) {
    const a = await db.professionalProfile.findUniqueOrThrow({ where: { id: assigneeId }, select: { userId: true } });
    await notify(a.userId, "FOLLOW_UP_TASK", { title: "Task assigned to you", body: i.title, link: "/staff/monitoring", key: dedupeKey("TASK_ASSIGN", t.id) });
  }
  return t;
}

export async function completeTask(actor: Actor, id: string) {
  const professionalId = requireProfessional(actor);
  const r = await db.followUpTask.updateMany({
    where: { id, assigneeId: professionalId, status: "OPEN" },
    data: { status: "DONE", completedAt: new Date() },
  });
  if (r.count === 0) throw notFound();
  await audit(actor.userId, "task.complete", "FollowUpTask", id);
}

export async function addInternalNote(actor: Actor, raw: unknown) {
  const professionalId = requireProfessional(actor);
  const i = noteSchema.parse(raw);
  await assertPatientAccess(actor, i.patientId);
  const n = await db.internalNote.create({ data: { patientId: i.patientId, authorId: professionalId, body: i.body } });
  await audit(actor.userId, "note.create", "InternalNote", n.id); // body never logged
  return n;
}

/** Internal notes are staff-only: this function refuses every non-professional actor. */
export async function listInternalNotes(actor: Actor, patientId: string) {
  requireProfessional(actor);
  await assertPatientAccess(actor, patientId);
  return db.internalNote.findMany({
    where: { patientId },
    orderBy: { createdAt: "desc" },
    take: 50,
    include: { author: { include: { user: { select: { name: true } } } } },
  });
}

export async function listTasks(actor: Actor, opts: { patientId?: string } = {}) {
  const professionalId = requireProfessional(actor);
  if (opts.patientId) await assertPatientAccess(actor, opts.patientId);
  return db.followUpTask.findMany({
    where: {
      OR: [{ assigneeId: professionalId }, { createdById: professionalId }],
      ...(opts.patientId ? { patientId: opts.patientId } : {}),
      patient: { relationships: { some: { professionalId, status: "ACTIVE" } } },
    },
    orderBy: [{ status: "asc" }, { dueAt: "asc" }],
    take: 100,
    include: { patient: { include: { user: { select: { name: true } } } }, assignee: { include: { user: { select: { name: true } } } } },
  });
}

// ---------------- Monitoring + overview ----------------

export type MonitoringFlag = { patientId: string; patientName: string; kind: "dose_exceptions" | "routines_incomplete" | "overdue_task" | "new_symptoms" | "stale"; detail: string };

export async function monitoring(actor: Actor, now = new Date(), staleDaysArg?: number) {
  const professionalId = requireProfessional(actor);
  const setting = await db.appSetting.findUnique({ where: { key: "staleDays" } });
  const staleDays = staleDaysArg ?? (typeof setting?.value === "number" ? setting.value : STALE_DAYS_DEFAULT);
  const rels = await db.careRelationship.findMany({
    where: { professionalId, status: "ACTIVE" },
    include: { consents: true, patient: { include: { user: { select: { name: true, timezone: true } } } } },
  });
  const flags: MonitoringFlag[] = [];
  const dayAgo7 = new Date(now.getTime() - 7 * 86400_000);
  const staleCut = new Date(now.getTime() - staleDays * 86400_000);

  for (const rel of rels) {
    const ok = (t: string) => rel.consents.some((c) => c.type === t && c.granted);
    const name = rel.patient.user.name;
    const pid = rel.patientId;
    let anyRecent = false;
    let anyChannel = false;

    if (ok("MEDICATION_ADHERENCE")) {
      anyChannel = true;
      const rows = await adherenceRows([pid], dayAgo7, now, now);
      const exc = rows.filter((r) => r.eff === "MISSED" || r.eff === "SKIPPED").length;
      if (exc > 0) flags.push({ patientId: pid, patientName: name, kind: "dose_exceptions", detail: `${exc} missed or skipped dose(s) reported in the last 7 days` });
      const recent = await db.medicationIntake.count({ where: { plan: { patientId: pid }, recordedAt: { gte: staleCut } } });
      const hasPlans = await db.medicationPlan.count({ where: { patientId: pid, status: "ACTIVE" } });
      if (recent > 0 || hasPlans === 0) anyRecent = true;
    }
    if (ok("ROUTINES")) {
      anyChannel = true;
      const today = localDateString(now, rel.patient.user.timezone);
      const routines = await db.routineDefinition.findMany({ where: { patientId: pid, active: true }, include: { completions: { where: { localDate: { gte: addDaysToLocalDate(today, -staleDays) } } } } });
      const dow = new Date(`${today}T00:00:00Z`).getUTCDay();
      const due = routines.filter((r) => !r.daysOfWeek.length || r.daysOfWeek.includes(dow));
      const missingToday = due.filter((r) => !r.completions.some((c) => c.localDate === today));
      // Only flag after the day is mostly over, to avoid noise earlier in the day.
      const hour = Number(now.toLocaleTimeString("en-GB", { hour: "2-digit", hour12: false, timeZone: rel.patient.user.timezone }));
      if (missingToday.length && hour >= 18) flags.push({ patientId: pid, patientName: name, kind: "routines_incomplete", detail: `${missingToday.length} routine(s) not marked done today` });
      if (routines.length === 0 || routines.some((r) => r.completions.length)) anyRecent = true;
    }
    if (ok("JOURNAL")) {
      anyChannel = true;
      const entries = await db.journalEntry.findMany({ where: { patientId: pid, sharedWithTeam: true, recordedAt: { gte: staleCut } }, select: { symptoms: true } });
      if (entries.length) anyRecent = true;
      const withSymptoms = entries.filter((e) => e.symptoms.length).length;
      if (withSymptoms) flags.push({ patientId: pid, patientName: name, kind: "new_symptoms", detail: `${withSymptoms} journal entr${withSymptoms === 1 ? "y" : "ies"} with symptoms in the last ${staleDays} days` });
    }
    if (anyChannel && !anyRecent) flags.push({ patientId: pid, patientName: name, kind: "stale", detail: `No patient updates in ${staleDays}+ days` });
  }

  const overdue = await db.followUpTask.findMany({
    where: { assigneeId: professionalId, status: "OPEN", dueAt: { lt: now } },
    include: { patient: { include: { user: { select: { name: true } } } } },
  });
  for (const t of overdue) flags.push({ patientId: t.patientId, patientName: t.patient.user.name, kind: "overdue_task", detail: `Overdue: ${t.title}` });
  return flags;
}

export async function staffOverview(actor: Actor, now = new Date()) {
  const professionalId = requireProfessional(actor);
  const [patientCount, upcoming, openTasks, pendingRequests, flags] = await Promise.all([
    db.careRelationship.count({ where: { professionalId, status: "ACTIVE" } }),
    db.appointment.findMany({
      where: { professionalId, status: { in: ["CONFIRMED", "REQUESTED", "RESCHEDULE_REQUESTED", "CANCEL_REQUESTED"] }, startsAt: { gte: now }, patient: { relationships: { some: { professionalId, status: "ACTIVE" } } } },
      orderBy: { startsAt: "asc" },
      take: 5,
      include: { patient: { include: { user: { select: { name: true } } } } },
    }),
    db.followUpTask.count({ where: { assigneeId: professionalId, status: "OPEN" } }),
    db.careRelationship.count({ where: { professionalId, status: "REQUESTED" } }),
    monitoring(actor, now),
  ]);
  const adherenceIds = await consentedPatientIds(professionalId, "MEDICATION_ADHERENCE");
  const rows = adherenceIds.length ? await adherenceRows(adherenceIds, new Date(now.getTime() - 7 * 86400_000), now, now) : [];
  const exceptions = rows.filter((r) => r.eff === "MISSED" || r.eff === "SKIPPED").length;
  return { patientCount, upcoming, openTasks, pendingRequests, flags, exceptions7d: exceptions, patientsFlagged: new Set(flags.map((f) => f.patientId)).size };
}

// ---------------- Reports + CSV ----------------

const csvCell = (v: unknown) => {
  let s = String(v ?? "");
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`; // neutralise spreadsheet formula injection
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

/** Team adherence CSV: only patients who consented to adherence sharing; no free-text, no emails. */
export async function adherenceCsv(actor: Actor, days: number, now = new Date()) {
  const professionalId = requireProfessional(actor);
  const ids = await consentedPatientIds(professionalId, "MEDICATION_ADHERENCE");
  const patients = await db.patientProfile.findMany({ where: { id: { in: ids } }, include: { user: { select: { name: true } } } });
  const rows = ids.length ? await adherenceRows(ids, new Date(now.getTime() - days * 86400_000), now, now) : [];
  const lines = [["patient", "period_days", "taken", "skipped", "missed", "adherence_percent"].join(",")];
  for (const p of patients) {
    const t = tally(rows.filter((r) => r.plan.patientId === p.id));
    lines.push([p.user.name, days, t.taken, t.skipped, t.missed, t.rate ?? ""].map(csvCell).join(","));
  }
  await audit(actor.userId, "report.export", "adherence", undefined, { days, patients: patients.length });
  return lines.join("\n") + "\n";
}

export async function teamReport(actor: Actor, days: number, now = new Date()) {
  const professionalId = requireProfessional(actor);
  const ids = await consentedPatientIds(professionalId, "MEDICATION_ADHERENCE");
  const rows = ids.length ? await adherenceRows(ids, new Date(now.getTime() - days * 86400_000), now, now) : [];
  const from = new Date(now.getTime() - days * 86400_000);
  const appts = await db.appointment.groupBy({
    by: ["status"],
    where: { professionalId, startsAt: { gte: from, lt: now }, patient: { relationships: { some: { professionalId, status: "ACTIVE" } } } },
    _count: true,
  });
  const symptomPatients = await consentedPatientIds(professionalId, "JOURNAL");
  const symptomEntries = symptomPatients.length
    ? await db.journalEntry.count({ where: { patientId: { in: symptomPatients }, sharedWithTeam: true, recordedAt: { gte: from }, symptoms: { isEmpty: false } } })
    : 0;
  const routinePatients = await consentedPatientIds(professionalId, "ROUTINES");
  const completions = routinePatients.length
    ? await db.routineCompletion.count({ where: { routine: { patientId: { in: routinePatients } }, completedAt: { gte: from } } })
    : 0;
  const openTasks = await db.followUpTask.count({ where: { assigneeId: professionalId, status: "OPEN" } });
  const overdueTasks = await db.followUpTask.count({ where: { assigneeId: professionalId, status: "OPEN", dueAt: { lt: now } } });
  return {
    adherence: tally(rows),
    appointments: Object.fromEntries(appts.map((a) => [a.status, a._count])),
    symptomEntries,
    routineCompletions: completions,
    openTasks,
    overdueTasks,
    patientsIncluded: { adherence: ids.length, journal: symptomPatients.length, routines: routinePatients.length },
  };
}

// ---------------- Patient profile bundle (staff) ----------------

export async function patientProfileForStaff(actor: Actor, patientId: string) {
  const { relationshipId } = await assertPatientAccess(actor, patientId);
  const rel = await db.careRelationship.findUniqueOrThrow({ where: { id: relationshipId! }, include: { consents: true } });
  const p = await db.patientProfile.findUniqueOrThrow({ where: { id: patientId }, include: { user: { select: { name: true, email: true, timezone: true } } } });
  await audit(actor.userId, "patient.view", "PatientProfile", patientId);
  return { patient: p, relationship: rel, consents: Object.fromEntries(rel.consents.map((c) => [c.type, c.granted])) as Record<string, boolean> };
}
