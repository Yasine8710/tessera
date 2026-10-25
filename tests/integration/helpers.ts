import { randomUUID } from "node:crypto";
import type { Actor } from "@/server/access";
import { db } from "@/server/db";
import * as auth from "@/server/services/auth";

export const PASSWORD = "correct-horse-battery-1";
export const uniq = (p: string) => `${p}-${randomUUID().slice(0, 8)}@test.invalid`;

export async function actorFor(userId: string): Promise<Actor> {
  const u = await db.user.findUniqueOrThrow({ where: { id: userId }, include: { patientProfile: true, professionalProfile: true } });
  const verifiedPro = u.role === "PROFESSIONAL" && u.status === "ACTIVE" && !!u.professionalProfile?.verifiedAt;
  return {
    userId: u.id,
    role: u.role,
    timezone: u.timezone,
    patientId: u.patientProfile?.id,
    professionalId: verifiedPro ? u.professionalProfile!.id : undefined,
  };
}

export async function makePatient(name = "Test Patient") {
  const email = uniq("pat");
  const { userId } = await auth.registerPatient(
    { name, email, password: PASSWORD, timezone: "UTC", acceptTerms: true },
    randomUUID(),
  );
  return { email, userId, actor: await actorFor(userId) };
}

/** Registers a professional and approves them the way an admin would. */
export async function makeProfessional(approved = true) {
  const email = uniq("pro");
  const { userId } = await auth.registerProfessional(
    { name: "Dr Test", email, password: PASSWORD, timezone: "UTC", profession: "GP", licenseNumber: "LIC-1234", licenseRegion: "Testland", acceptTerms: true },
    randomUUID(),
  );
  if (approved) {
    await db.user.update({ where: { id: userId }, data: { status: "ACTIVE" } });
    await db.professionalProfile.update({ where: { userId }, data: { verifiedAt: new Date() } });
  }
  return { email, userId, actor: await actorFor(userId) };
}

export async function makeAdmin() {
  const u = await db.user.create({
    data: { email: uniq("adm"), name: "Admin", passwordHash: "!", role: "ADMIN", status: "ACTIVE" },
  });
  return { userId: u.id, actor: await actorFor(u.id) };
}

export const ALL_CONSENTS = { JOURNAL: true, MEASUREMENTS: true, ROUTINES: true, MEDICATION_ADHERENCE: true } as const;
