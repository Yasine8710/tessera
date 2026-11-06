import { canReportIntake, dedupeKey, effectiveIntakeStatus, planChanged, type PlanSnapshot } from "@/domain/rules";
import { addDaysToLocalDate, expandSchedule, localDateString } from "@/domain/schedule";
import {
  carePlanSchema,
  carePlanUpdateSchema,
  changeRequestSchema,
  intakeReportSchema,
  medicationPlanSchema,
} from "@/lib/schemas";
import { type Actor, assertPatientAccess, requirePatient, requireProfessional } from "../access";
import { audit } from "../audit";
import { db, createIntakesIfMissing, type Tx } from "../db";
import { conflict, forbidden, invalid, notFound } from "../errors";
import { notify } from "./notifications";

const day = (s: string) => new Date(`${s}T00:00:00.000Z`);
const dayStr = (d: Date) => d.toISOString().slice(0, 10);

async function snapshot(tx: Tx, planId: string) {
  const p = await tx.carePlan.findUniqueOrThrow({
    where: { id: planId },
    include: { medications: { include: { medication: true } } },
  });
  return {
    title: p.title,
    instructions: p.instructions,
    startDate: dayStr(p.startDate),
    endDate: p.endDate ? dayStr(p.endDate) : null,
    medications: p.medications.map((m) => ({
      name: m.medication.name,
      dose: m.dose,
      route: m.route,
      instructions: m.instructions,
      timesOfDay: m.timesOfDay,
      daysOfWeek: m.daysOfWeek,
      status: m.status,
    })),
  };
}

async function bumpVersion(tx: Tx, planId: string, authorId: string, reason: string) {
  const plan = await tx.carePlan.update({ where: { id: planId }, data: { version: { increment: 1 } } });
  await tx.carePlanVersion.create({
    data: { planId, version: plan.version, snapshot: await snapshot(tx, planId), reason, authorId },
  });
  return plan.version;
}

// ---------------- Care plans ----------------

export async function createCarePlan(actor: Actor, patientId: string, raw: unknown) {
  const professionalId = requireProfessional(actor);
  await assertPatientAccess(actor, patientId);
  const i = carePlanSchema.parse(raw);
  if (i.endDate && i.endDate < i.startDate) throw invalid("End date must be after the start date.");
  const plan = await db.$transaction(async (tx) => {
    const p = await tx.carePlan.create({
      data: {
        patientId,
        professionalId,
        title: i.title,
        instructions: i.instructions,
        startDate: day(i.startDate),
        endDate: i.endDate ? day(i.endDate) : null,
      },
    });
    await tx.carePlanVersion.create({
      data: { planId: p.id, version: 1, snapshot: await snapshot(tx, p.id), reason: "Initial plan", authorId: actor.userId },
    });
    await audit(actor.userId, "careplan.create", "CarePlan", p.id, undefined, tx);
    return p;
  });
  await notifyPatientOfPlan(patientId, plan.id, "A new care plan was shared with you.");
  return plan;
}

export async function updateCarePlan(actor: Actor, planId: string, raw: unknown) {
  const professionalId = requireProfessional(actor);
  const plan = await db.carePlan.findUnique({ where: { id: planId } });
  if (!plan) throw notFound();
  await assertPatientAccess(actor, plan.patientId);
  if (plan.professionalId !== professionalId) throw forbidden("Only the authoring professional can change this plan.");
  const i = carePlanUpdateSchema.parse(raw);
  const before: PlanSnapshot = {
    title: plan.title,
    instructions: plan.instructions,
    startDate: dayStr(plan.startDate),
    endDate: plan.endDate ? dayStr(plan.endDate) : null,
  };
  const after: PlanSnapshot = {
    title: i.title,
    instructions: i.instructions,
    startDate: i.startDate,
    endDate: i.endDate || null,
  };
  if (!planChanged(before, after)) throw invalid("Nothing was changed.");
  if (after.endDate && after.endDate < after.startDate) throw invalid("End date must be after the start date.");
  await db.$transaction(async (tx) => {
    await tx.carePlan.update({
      where: { id: planId },
      data: {
        title: after.title,
        instructions: after.instructions,
        startDate: day(after.startDate),
        endDate: after.endDate ? day(after.endDate) : null,
      },
    });
    const v = await bumpVersion(tx, planId, actor.userId, i.reason);
    await audit(actor.userId, "careplan.update", "CarePlan", planId, { version: v }, tx);
  });
  await notifyPatientOfPlan(plan.patientId, planId, "Your care plan was updated.");
}

async function notifyPatientOfPlan(patientId: string, planId: string, body: string) {
  const p = await db.patientProfile.findUniqueOrThrow({ where: { id: patientId }, select: { userId: true } });
  const v = await db.carePlan.findUniqueOrThrow({ where: { id: planId }, select: { version: true } });
  await notify(p.userId, "SYSTEM", {
    title: "Care plan",
    body,
    link: "/patient/care-plan",
    key: dedupeKey("PLAN", planId, v.version),
  });
}

export async function addMedicationToPlan(actor: Actor, carePlanId: string, raw: unknown) {
  const professionalId = requireProfessional(actor);
  const plan = await db.carePlan.findUnique({ where: { id: carePlanId } });
  if (!plan) throw notFound();
  await assertPatientAccess(actor, plan.patientId);
  if (plan.professionalId !== professionalId) throw forbidden("Only the authoring professional can change this plan.");
  if (plan.status !== "ACTIVE") throw conflict("This plan has ended.");
  const i = medicationPlanSchema.parse(raw);
  if (i.endDate && i.endDate < i.startDate) throw invalid("End date must be after the start date.");
  const mp = await db.$transaction(async (tx) => {
    const med = await tx.medication.upsert({
      where: { name: i.medicationName },
      create: { name: i.medicationName },
      update: {},
    });
    const m = await tx.medicationPlan.create({
      data: {
        carePlanId,
        patientId: plan.patientId,
        medicationId: med.id,
        prescribedById: actor.userId,
        dose: i.dose,
        route: i.route || null,
        instructions: i.instructions || null,
        timesOfDay: i.timesOfDay,
        daysOfWeek: i.daysOfWeek,
        startDate: day(i.startDate),
        endDate: i.endDate ? day(i.endDate) : null,
      },
    });
    await bumpVersion(tx, carePlanId, actor.userId, `Medication added: ${i.medicationName}`);
    await audit(actor.userId, "medication.add", "MedicationPlan", m.id, undefined, tx);
    return m;
  });
  await ensureIntakes(plan.patientId);
  await notifyPatientOfPlan(plan.patientId, carePlanId, "A medication schedule was added to your plan.");
  return mp;
}

export async function stopMedicationPlan(actor: Actor, medicationPlanId: string, reason: string) {
  requireProfessional(actor);
  if (reason.trim().length < 3) throw invalid("Give a reason.");
  const mp = await db.medicationPlan.findUnique({ where: { id: medicationPlanId }, include: { carePlan: true, medication: true } });
  if (!mp) throw notFound();
  await assertPatientAccess(actor, mp.patientId);
  if (mp.carePlan.professionalId !== actor.professionalId) throw forbidden("Only the authoring professional can change this plan.");
  await db.$transaction(async (tx) => {
    await tx.medicationPlan.update({ where: { id: mp.id }, data: { status: "ENDED", endDate: day(localDateString(new Date(), "UTC")) } });
    await tx.medicationIntake.deleteMany({ where: { planId: mp.id, status: "SCHEDULED", scheduledFor: { gt: new Date() } } });
    await bumpVersion(tx, mp.carePlanId, actor.userId, `Medication stopped: ${mp.medication.name} — ${reason}`);
    await audit(actor.userId, "medication.stop", "MedicationPlan", mp.id, undefined, tx);
  });
}

export async function listCarePlans(actor: Actor, patientId: string) {
  await assertPatientAccess(actor, patientId);
  return db.carePlan.findMany({
    where: { patientId },
    orderBy: { createdAt: "desc" },
    include: {
      professional: { include: { user: { select: { name: true } } } },
      medications: { include: { medication: true }, orderBy: { createdAt: "asc" } },
      versions: { orderBy: { version: "desc" } },
    },
  });
}

// ---------------- Dose records ----------------

/** Lazily materialise dose rows for the window around now (also done by the cron job). */
export async function ensureIntakes(patientId: string, now = new Date()) {
  const p = await db.patientProfile.findUniqueOrThrow({ where: { id: patientId }, include: { user: true } });
  const plans = await db.medicationPlan.findMany({ where: { patientId, status: "ACTIVE" } });
  const from = new Date(now.getTime() - 2 * 86400_000);
  const to = new Date(now.getTime() + 2 * 86400_000);
  for (const plan of plans) {
    const times = expandSchedule(
      { timesOfDay: plan.timesOfDay, daysOfWeek: plan.daysOfWeek, startDate: dayStr(plan.startDate), endDate: plan.endDate ? dayStr(plan.endDate) : null },
      p.user.timezone,
      from,
      to,
    );
    await createIntakesIfMissing(plan.id, times);
  }
}

export async function listDoses(actor: Actor, opts: { fromDays?: number; toDays?: number; now?: Date } = {}) {
  const patientId = requirePatient(actor);
  const now = opts.now ?? new Date();
  await ensureIntakes(patientId, now);
  const from = new Date(now.getTime() - (opts.fromDays ?? 1) * 86400_000);
  const to = new Date(now.getTime() + (opts.toDays ?? 1) * 86400_000);
  const rows = await db.medicationIntake.findMany({
    where: { plan: { patientId }, scheduledFor: { gte: from, lt: to } },
    include: { plan: { include: { medication: true } } },
    orderBy: { scheduledFor: "asc" },
  });
  return rows.map((r) => ({ ...r, effectiveStatus: effectiveIntakeStatus(r.status, r.scheduledFor, now) }));
}

export async function listMedicationPlans(actor: Actor) {
  const patientId = requirePatient(actor);
  return db.medicationPlan.findMany({
    where: { patientId },
    include: { medication: true, carePlan: { include: { professional: { include: { user: { select: { name: true } } } } } } },
    orderBy: [{ status: "asc" }, { startDate: "desc" }],
  });
}

export async function reportIntake(actor: Actor, raw: unknown, now = new Date()) {
  const patientId = requirePatient(actor);
  const i = intakeReportSchema.parse(raw);
  const intake = await db.medicationIntake.findUnique({ where: { id: i.intakeId }, include: { plan: true } });
  if (!intake || intake.plan.patientId !== patientId) throw notFound();
  const verdict = canReportIntake(intake.status, i.status, intake.scheduledFor, now);
  if (!verdict.ok) throw invalid(verdict.reason);
  const takenAt = i.status === "TAKEN" ? (i.takenAt ? new Date(i.takenAt) : now) : null;
  if (takenAt && takenAt.getTime() > now.getTime() + 5 * 60_000) throw invalid("Intake time cannot be in the future.");
  await db.medicationIntake.update({
    where: { id: intake.id },
    data: { status: i.status, takenAt, note: i.note || null, recordedAt: now },
  });
  await audit(actor.userId, "intake.report", "MedicationIntake", intake.id, { status: i.status });
}

// ---------------- Prescription change requests ----------------

export async function createChangeRequest(actor: Actor, raw: unknown) {
  const patientId = requirePatient(actor);
  const i = changeRequestSchema.parse(raw);
  const plan = await db.medicationPlan.findFirst({
    where: { id: i.planId, patientId },
    include: { carePlan: { include: { professional: true } }, medication: true },
  });
  if (!plan) throw notFound();
  const r = await db.medicationChangeRequest.create({ data: { planId: plan.id, patientId, message: i.message } });
  await audit(actor.userId, "medication.change_request", "MedicationChangeRequest", r.id);
  await notify(plan.carePlan.professional.userId, "SYSTEM", {
    title: "Medication question from a patient",
    body: `About ${plan.medication.name}. Review in the patient profile.`,
    link: `/staff/patients/${patientId}`,
    key: dedupeKey("CHGREQ", r.id),
  });
  return r;
}

export async function resolveChangeRequest(actor: Actor, id: string, response: string) {
  requireProfessional(actor);
  const r = await db.medicationChangeRequest.findUnique({ where: { id }, include: { plan: { include: { carePlan: true } } } });
  if (!r) throw notFound();
  await assertPatientAccess(actor, r.patientId);
  if (response.trim().length < 2) throw invalid("Write a response.");
  await db.medicationChangeRequest.update({ where: { id }, data: { status: "RESOLVED", response: response.trim() } });
  await audit(actor.userId, "medication.change_request_resolved", "MedicationChangeRequest", id);
}

export async function listChangeRequests(actor: Actor, patientId: string) {
  await assertPatientAccess(actor, patientId);
  return db.medicationChangeRequest.findMany({
    where: { patientId },
    orderBy: { createdAt: "desc" },
    include: { plan: { include: { medication: true } } },
  });
}

export { addDaysToLocalDate };
