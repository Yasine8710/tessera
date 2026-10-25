import type { Actor } from "../access";
import { audit } from "../audit";
import { db } from "../db";
import { invalid } from "../errors";
import { verifyPassword } from "../security";

/** Self-service data export (JSON). Own data only; never other people's content. */
export async function exportMyData(actor: Actor) {
  const user = await db.user.findUniqueOrThrow({
    where: { id: actor.userId },
    select: { id: true, email: true, name: true, role: true, timezone: true, createdAt: true },
  });
  const base: Record<string, unknown> = { exportedAt: new Date().toISOString(), account: user };
  if (actor.patientId) {
    const id = actor.patientId;
    const [profile, plans, intakes, routines, journal, measurements, appointments, consents] = await Promise.all([
      db.patientProfile.findUnique({ where: { id }, select: { dateOfBirth: true, phone: true, emergencyContact: true } }),
      db.medicationPlan.findMany({ where: { patientId: id }, include: { medication: true } }),
      db.medicationIntake.findMany({ where: { plan: { patientId: id } }, orderBy: { scheduledFor: "asc" } }),
      db.routineDefinition.findMany({ where: { patientId: id }, include: { completions: true } }),
      db.journalEntry.findMany({ where: { patientId: id } }),
      db.measurement.findMany({ where: { patientId: id } }),
      db.appointment.findMany({ where: { patientId: id } }),
      db.consent.findMany({ where: { relationship: { patientId: id } } }),
    ]);
    Object.assign(base, { profile, medicationPlans: plans, doseRecords: intakes, routines, journal, measurements, appointments, consents });
  }
  await audit(actor.userId, "account.export", "User", actor.userId);
  return base;
}

/**
 * Account closure: access ends immediately and personal identifiers are removed.
 * Clinical entries that a jurisdiction requires to be retained are kept in
 * de-identified form; see docs/PRIVACY.md.
 */
export async function deleteMyAccount(actor: Actor, password: string) {
  const u = await db.user.findUniqueOrThrow({ where: { id: actor.userId } });
  if (!(await verifyPassword(password, u.passwordHash))) throw invalid("Password is incorrect.");
  if (u.role === "ADMIN") throw invalid("Administrator accounts are closed through the CLI.");
  await db.$transaction(async (tx) => {
    await tx.session.deleteMany({ where: { userId: u.id } });
    await tx.authToken.deleteMany({ where: { userId: u.id } });
    await tx.careRelationship.updateMany({
      where: { OR: [{ patient: { userId: u.id } }, { professional: { userId: u.id } }], status: { in: ["ACTIVE", "REQUESTED"] } },
      data: { status: "ENDED", endedAt: new Date() },
    });
    await tx.patientProfile.updateMany({ where: { userId: u.id }, data: { phone: null, emergencyContact: null, dateOfBirth: null } });
    await tx.user.update({
      where: { id: u.id },
      data: { deletedAt: new Date(), status: "SUSPENDED", email: `deleted-${u.id}@deleted.invalid`, name: "Deleted user", passwordHash: "!" },
    });
    await audit(u.id, "account.delete", "User", u.id, undefined, tx);
  });
}
