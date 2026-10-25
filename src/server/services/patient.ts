import { MEASUREMENT_LIMITS, canTransitionAppointment, currentStreak, dedupeKey, validateMeasurement } from "@/domain/rules";
import { addDaysToLocalDate, localDateString } from "@/domain/schedule";
import {
  appointmentRequestSchema,
  appointmentScheduleSchema,
  journalSchema,
  measurementSchema,
  routineSchema,
} from "@/lib/schemas";
import { type Actor, assertPatientAccess, requirePatient, requireProfessional } from "../access";
import { audit } from "../audit";
import { db } from "../db";
import { conflict, forbidden, invalid, notFound } from "../errors";
import { notify } from "./notifications";

// ---------------- Routines ----------------

export async function createRoutine(actor: Actor, raw: unknown, forPatientId?: string) {
  const i = routineSchema.parse(raw);
  let patientId: string;
  let clinicianDefined = false;
  let carePlanId: string | null = null;
  if (actor.role === "PATIENT") {
    patientId = requirePatient(actor);
    if (i.kind === "CLINICIAN_TASK") throw forbidden("Only your care team can create clinician tasks.");
  } else {
    requireProfessional(actor);
    if (!forPatientId) throw invalid("Patient required.");
    await assertPatientAccess(actor, forPatientId);
    patientId = forPatientId;
    clinicianDefined = true;
    const plan = await db.carePlan.findFirst({ where: { patientId, professionalId: actor.professionalId, status: "ACTIVE" } });
    carePlanId = plan?.id ?? null;
  }
  const r = await db.routineDefinition.create({
    data: {
      patientId,
      carePlanId,
      createdByUserId: actor.userId,
      title: i.title,
      kind: i.kind,
      clinicianDefined,
      daysOfWeek: i.daysOfWeek,
      timeOfDay: i.timeOfDay || null,
    },
  });
  await audit(actor.userId, "routine.create", "RoutineDefinition", r.id);
  return r;
}

export async function setRoutineActive(actor: Actor, id: string, active: boolean) {
  const patientId = requirePatient(actor);
  const r = await db.routineDefinition.findFirst({ where: { id, patientId } });
  if (!r) throw notFound();
  if (r.clinicianDefined) throw forbidden("This routine was set by your care team.");
  await db.routineDefinition.update({ where: { id }, data: { active } });
}

export async function toggleRoutineToday(actor: Actor, routineId: string, done: boolean, note?: string, now = new Date()) {
  const patientId = requirePatient(actor);
  const r = await db.routineDefinition.findFirst({ where: { id: routineId, patientId } });
  if (!r) throw notFound();
  const today = localDateString(now, actor.timezone);
  if (done) {
    await db.routineCompletion.upsert({
      where: { routineId_localDate: { routineId, localDate: today } },
      create: { routineId, localDate: today, note: note?.slice(0, 500) || null },
      update: { note: note?.slice(0, 500) || null },
    });
  } else {
    await db.routineCompletion.deleteMany({ where: { routineId, localDate: today } });
  }
}

export async function listRoutines(actor: Actor, now = new Date()) {
  const patientId = requirePatient(actor);
  const today = localDateString(now, actor.timezone);
  const since = addDaysToLocalDate(today, -29);
  const rows = await db.routineDefinition.findMany({
    where: { patientId },
    orderBy: [{ active: "desc" }, { createdAt: "asc" }],
    include: { completions: { where: { localDate: { gte: since } } } },
  });
  const week = Array.from({ length: 7 }, (_, k) => addDaysToLocalDate(today, k - 6));
  return rows.map((r) => {
    const dates = r.completions.map((c) => c.localDate);
    return {
      ...r,
      doneToday: dates.includes(today),
      streak: currentStreak(dates, today, (d) => addDaysToLocalDate(d, -1)),
      week: week.map((d) => ({ date: d, done: dates.includes(d) })),
    };
  });
}

// ---------------- Journal + measurements ----------------

export async function addJournalEntry(actor: Actor, raw: unknown) {
  const patientId = requirePatient(actor);
  const i = journalSchema.parse(raw);
  if (i.wellbeing == null && i.painScore == null && !i.symptoms.length && !i.text) throw invalid("Add at least one detail.");
  const recordedAt = i.recordedAt ? new Date(i.recordedAt) : new Date();
  if (recordedAt.getTime() > Date.now() + 5 * 60_000) throw invalid("Entry time cannot be in the future.");
  const e = await db.journalEntry.create({
    data: { patientId, recordedAt, wellbeing: i.wellbeing, painScore: i.painScore, symptoms: i.symptoms, text: i.text || null, sharedWithTeam: i.sharedWithTeam },
  });
  await audit(actor.userId, "journal.create", "JournalEntry", e.id);
  return e;
}

export async function listJournal(actor: Actor, opts: { patientId?: string; page?: number; pageSize?: number } = {}) {
  const pageSize = Math.min(opts.pageSize ?? 20, 50);
  const page = Math.max(opts.page ?? 1, 1);
  let patientId: string;
  let sharedOnly = false;
  if (actor.role === "PATIENT") patientId = requirePatient(actor);
  else {
    if (!opts.patientId) throw invalid("Patient required.");
    await assertPatientAccess(actor, opts.patientId, "JOURNAL");
    patientId = opts.patientId;
    sharedOnly = true;
  }
  const where = { patientId, ...(sharedOnly ? { sharedWithTeam: true } : {}) };
  const [total, rows] = await Promise.all([
    db.journalEntry.count({ where }),
    db.journalEntry.findMany({ where, orderBy: { recordedAt: "desc" }, skip: (page - 1) * pageSize, take: pageSize }),
  ]);
  return { total, page, pageSize, rows };
}

export async function addMeasurement(actor: Actor, raw: unknown) {
  const patientId = requirePatient(actor);
  const i = measurementSchema.parse(raw);
  const err = validateMeasurement(i.type, i.value, i.value2);
  if (err) throw invalid(err);
  const recordedAt = i.recordedAt ? new Date(i.recordedAt) : new Date();
  if (recordedAt.getTime() > Date.now() + 5 * 60_000) throw invalid("Measurement time cannot be in the future.");
  const m = await db.measurement.create({
    data: { patientId, type: i.type, value: i.value, value2: i.type === "BLOOD_PRESSURE" ? i.value2 : null, unit: MEASUREMENT_LIMITS[i.type].unit, recordedAt },
  });
  await audit(actor.userId, "measurement.create", "Measurement", m.id);
  return m;
}

export async function listMeasurements(actor: Actor, patientId?: string, take = 100) {
  let pid: string;
  if (actor.role === "PATIENT") pid = requirePatient(actor);
  else {
    if (!patientId) throw invalid("Patient required.");
    await assertPatientAccess(actor, patientId, "MEASUREMENTS");
    pid = patientId;
  }
  return db.measurement.findMany({ where: { patientId: pid }, orderBy: { recordedAt: "desc" }, take });
}

// ---------------- Appointments ----------------

export async function requestAppointment(actor: Actor, raw: unknown) {
  const patientId = requirePatient(actor);
  const i = appointmentRequestSchema.parse(raw);
  const rel = await db.careRelationship.findFirst({
    where: { patientId, professionalId: i.professionalId, status: "ACTIVE" },
    include: { professional: true },
  });
  if (!rel) throw notFound("That professional is not on your care team.");
  const startsAt = new Date(i.startsAt);
  if (startsAt.getTime() < Date.now()) throw invalid("Choose a future time.");
  const a = await db.appointment.create({
    data: { patientId, professionalId: i.professionalId, title: i.title, startsAt, endsAt: new Date(startsAt.getTime() + i.durationMin * 60_000), status: "REQUESTED", requestedBy: "PATIENT" },
  });
  await audit(actor.userId, "appointment.request", "Appointment", a.id);
  await notify(rel.professional.userId, "APPOINTMENT_REMINDER", {
    title: "Appointment request",
    body: i.title,
    link: "/staff/appointments",
    key: dedupeKey("APPT_REQ", a.id),
  });
  return a;
}

export async function scheduleAppointment(actor: Actor, raw: unknown) {
  const professionalId = requireProfessional(actor);
  const i = appointmentScheduleSchema.parse(raw);
  await assertPatientAccess(actor, i.patientId);
  const startsAt = new Date(i.startsAt);
  const a = await db.appointment.create({
    data: {
      patientId: i.patientId,
      professionalId,
      title: i.title,
      location: i.location || null,
      startsAt,
      endsAt: new Date(startsAt.getTime() + i.durationMin * 60_000),
      status: "CONFIRMED",
      requestedBy: "PROFESSIONAL",
    },
  });
  await audit(actor.userId, "appointment.schedule", "Appointment", a.id);
  const p = await db.patientProfile.findUniqueOrThrow({ where: { id: i.patientId }, select: { userId: true } });
  await notify(p.userId, "APPOINTMENT_REMINDER", {
    title: "Appointment scheduled",
    body: i.title,
    link: "/patient/appointments",
    key: dedupeKey("APPT_NEW", a.id),
  });
  return a;
}

/** Patients can only *request* cancel/reschedule; staff decide. */
export async function patientAppointmentAction(actor: Actor, id: string, action: "CANCEL" | "RESCHEDULE") {
  const patientId = requirePatient(actor);
  const a = await db.appointment.findFirst({ where: { id, patientId }, include: { professional: true } });
  if (!a) throw notFound();
  let next: "CANCELLED" | "CANCEL_REQUESTED" | "RESCHEDULE_REQUESTED";
  if (action === "CANCEL") next = a.status === "REQUESTED" ? "CANCELLED" : "CANCEL_REQUESTED";
  else next = "RESCHEDULE_REQUESTED";
  if (!canTransitionAppointment(a.status, next)) throw conflict("This appointment cannot be changed in its current state.");
  await db.appointment.update({ where: { id }, data: { status: next } });
  await audit(actor.userId, `appointment.${action.toLowerCase()}`, "Appointment", id);
  await notify(a.professional.userId, "APPOINTMENT_REMINDER", {
    title: next === "RESCHEDULE_REQUESTED" ? "Reschedule requested" : "Cancellation",
    body: a.title,
    link: "/staff/appointments",
    key: dedupeKey("APPT_CHG", id, next),
  });
}

export async function staffAppointmentUpdate(
  actor: Actor,
  id: string,
  to: "CONFIRMED" | "CANCELLED" | "COMPLETED" | "NO_SHOW",
  extra: { sharedNotes?: string; startsAt?: string } = {},
) {
  const professionalId = requireProfessional(actor);
  const a = await db.appointment.findFirst({ where: { id, professionalId } });
  if (!a) throw notFound();
  await assertPatientAccess(actor, a.patientId);
  if (!canTransitionAppointment(a.status, to)) throw conflict(`Cannot move from ${a.status} to ${to}.`);
  const data: Record<string, unknown> = { status: to };
  if (extra.sharedNotes !== undefined) data.sharedNotes = extra.sharedNotes.slice(0, 2000) || null;
  if (extra.startsAt) {
    const s = new Date(extra.startsAt);
    data.startsAt = s;
    data.endsAt = new Date(s.getTime() + (a.endsAt.getTime() - a.startsAt.getTime()));
  }
  await db.appointment.update({ where: { id }, data });
  await audit(actor.userId, "appointment.update", "Appointment", id, { to });
  const p = await db.patientProfile.findUniqueOrThrow({ where: { id: a.patientId }, select: { userId: true } });
  await notify(p.userId, "APPOINTMENT_REMINDER", {
    title: `Appointment ${to.toLowerCase().replace("_", " ")}`,
    body: a.title,
    link: "/patient/appointments",
    key: dedupeKey("APPT_STAFF", id, to, extra.startsAt ?? ""),
  });
}

export async function listAppointments(actor: Actor, opts: { patientId?: string } = {}) {
  if (actor.role === "PATIENT") {
    const patientId = requirePatient(actor);
    return db.appointment.findMany({
      where: { patientId },
      orderBy: { startsAt: "desc" },
      take: 100,
      include: { professional: { include: { user: { select: { name: true } } } } },
    });
  }
  const professionalId = requireProfessional(actor);
  if (opts.patientId) await assertPatientAccess(actor, opts.patientId);
  return db.appointment.findMany({
    where: { professionalId, ...(opts.patientId ? { patientId: opts.patientId } : {}), patient: { relationships: { some: { professionalId, status: "ACTIVE" } } } },
    orderBy: { startsAt: "desc" },
    take: 100,
    include: { patient: { include: { user: { select: { name: true } } } } },
  });
}
