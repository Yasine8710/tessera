import type { ConsentType, Role } from "@prisma/client";
import { db } from "./db";
import { forbidden, notFound } from "./errors";

export type Actor = {
  userId: string;
  role: Role;
  timezone: string;
  patientId?: string; // PatientProfile.id
  professionalId?: string; // ProfessionalProfile.id (only set when verified + ACTIVE)
};

export function requirePatient(actor: Actor): string {
  if (actor.role !== "PATIENT" || !actor.patientId) throw forbidden("Patient account required.");
  return actor.patientId;
}

export function requireProfessional(actor: Actor): string {
  if (actor.role !== "PROFESSIONAL" || !actor.professionalId)
    throw forbidden("A verified medical professional account is required.");
  return actor.professionalId;
}

export function requireAdmin(actor: Actor): void {
  if (actor.role !== "ADMIN") throw forbidden("Administrator access required.");
}

/**
 * Central clinical-data gate.
 *  - Patients: only their own record.
 *  - Professionals: only patients with an ACTIVE care relationship, and (when
 *    `consent` is given) only data categories the patient has shared.
 *  - Admins: never (administration is not clinical access).
 * Unknown / unauthorised patients both surface as NOT_FOUND to avoid ID probing.
 */
export async function assertPatientAccess(
  actor: Actor,
  patientId: string,
  consent?: ConsentType,
): Promise<{ relationshipId: string | null }> {
  if (actor.role === "PATIENT") {
    if (actor.patientId !== patientId) throw notFound();
    return { relationshipId: null };
  }
  if (actor.role === "PROFESSIONAL" && actor.professionalId) {
    const rel = await db.careRelationship.findUnique({
      where: { patientId_professionalId: { patientId, professionalId: actor.professionalId } },
      include: { consents: true },
    });
    if (!rel || rel.status !== "ACTIVE") throw notFound();
    if (consent) {
      const c = rel.consents.find((x) => x.type === consent);
      if (!c?.granted) throw forbidden("The patient has not shared this information with you.");
    }
    return { relationshipId: rel.id };
  }
  throw forbidden();
}

export async function hasConsent(relationshipId: string, type: ConsentType): Promise<boolean> {
  const c = await db.consent.findUnique({ where: { relationshipId_type: { relationshipId, type } } });
  return !!c?.granted;
}

/** Which patients' records a professional may read for a data category. */
export async function consentedPatientIds(professionalId: string, type: ConsentType): Promise<string[]> {
  const rels = await db.careRelationship.findMany({
    where: { professionalId, status: "ACTIVE", consents: { some: { type, granted: true } } },
    select: { patientId: true },
  });
  return rels.map((r) => r.patientId);
}
