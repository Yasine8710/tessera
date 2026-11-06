import { addDaysToLocalDate, expandSchedule, localDateString } from "@/domain/schedule";
import { db } from "../db";
import { hashPassword } from "../security";

/**
 * 100% synthetic data. No real people, no real clinical records.
 * Emails use the reserved .invalid TLD so they can never reach a real inbox.
 */
export const DEMO_PASSWORD = "DemoPassw0rd!";
export const DEMO_ACCOUNTS = {
  patient: { email: "demo.patient@tessera.invalid", password: DEMO_PASSWORD },
  staff: { email: "demo.clinician@tessera.invalid", password: DEMO_PASSWORD },
};

const TZ = "Europe/Paris";
const d = (s: string) => new Date(`${s}T00:00:00.000Z`);

function rng(seed: number) {
  let s = seed;
  return () => ((s = (s * 1664525 + 1013904223) % 4294967296) / 4294967296);
}

type PatientSeed = { email: string; name: string; dob: string; meds: { name: string; dose: string; route: string; times: string[]; instr: string }[]; adherence: number; share: boolean };

const PATIENTS: PatientSeed[] = [
  { email: DEMO_ACCOUNTS.patient.email, name: "Alex Moreau (demo)", dob: "1968-04-12", adherence: 0.88, share: true, meds: [
    { name: "Metformin", dose: "500 mg", route: "Oral", times: ["08:00", "20:00"], instr: "Take with food." },
    { name: "Lisinopril", dose: "10 mg", route: "Oral", times: ["08:00"], instr: "Take in the morning." },
  ] },
  { email: "demo.patient2@tessera.invalid", name: "Sam Bernard (demo)", dob: "1975-09-03", adherence: 0.55, share: true, meds: [
    { name: "Atorvastatin", dose: "20 mg", route: "Oral", times: ["21:00"], instr: "Take in the evening." },
  ] },
  { email: "demo.patient3@tessera.invalid", name: "Jo Laurent (demo)", dob: "1982-01-27", adherence: 0.95, share: false, meds: [
    { name: "Levothyroxine", dose: "50 mcg", route: "Oral", times: ["07:00"], instr: "Empty stomach, 30 minutes before breakfast." },
  ] },
];

export async function ensureDemoData(now = new Date()) {
  if (await db.user.findUnique({ where: { email: DEMO_ACCOUNTS.staff.email } })) return;
  const passwordHash = await hashPassword(DEMO_PASSWORD);
  const rand = rng(42);
  const today = localDateString(now, TZ);

  const proUser = await db.user.create({
    data: {
      email: DEMO_ACCOUNTS.staff.email, name: "Dr. Camille Roux (demo)", passwordHash, role: "PROFESSIONAL", status: "ACTIVE",
      emailVerifiedAt: now, timezone: TZ, isDemo: true, notificationPref: { create: {} },
      professionalProfile: { create: { profession: "General practitioner", licenseNumber: "DEMO-000001", licenseRegion: "Demo region", specialty: "Primary care", verifiedAt: now } },
    },
    include: { professionalProfile: true },
  });
  const proId = proUser.professionalProfile!.id;

  for (const [idx, ps] of PATIENTS.entries()) {
    const u = await db.user.create({
      data: { email: ps.email, name: ps.name, passwordHash, role: "PATIENT", status: "ACTIVE", emailVerifiedAt: now, timezone: TZ, isDemo: true, notificationPref: { create: {} }, patientProfile: { create: { dateOfBirth: d(ps.dob) } } },
      include: { patientProfile: true },
    });
    const pid = u.patientProfile!.id;
    const rel = await db.careRelationship.create({ data: { patientId: pid, professionalId: proId, status: "ACTIVE", initiatedBy: "PROFESSIONAL", startedAt: new Date(now.getTime() - 40 * 86400_000) } });
    for (const type of ["JOURNAL", "MEASUREMENTS", "ROUTINES", "MEDICATION_ADHERENCE"] as const)
      await db.consent.create({ data: { relationshipId: rel.id, type, granted: ps.share } });
    const convo = await db.conversation.create({ data: { patientId: pid, professionalId: proId } });
    await db.conversationParticipant.createMany({ data: [{ conversationId: convo.id, userId: u.id }, { conversationId: convo.id, userId: proUser.id }] });
    await db.message.create({ data: { conversationId: convo.id, senderId: proUser.id, body: "Welcome to Tessera. Message me here about your plan. For emergencies, call your local emergency number.", createdAt: new Date(now.getTime() - 3 * 86400_000) } });

    const startDate = addDaysToLocalDate(today, -30);
    const plan = await db.carePlan.create({
      data: { patientId: pid, professionalId: proId, title: "Daily management plan", instructions: "Follow the medication schedule below, stay hydrated, and keep your journal up to date. Contact the practice if symptoms change.", startDate: d(startDate) },
    });
    await db.carePlanVersion.create({ data: { planId: plan.id, version: 1, snapshot: { title: plan.title }, reason: "Initial plan", authorId: proUser.id } });

    for (const m of ps.meds) {
      const med = await db.medication.upsert({ where: { name: m.name }, create: { name: m.name }, update: {} });
      const mp = await db.medicationPlan.create({
        data: { carePlanId: plan.id, patientId: pid, medicationId: med.id, prescribedById: proUser.id, dose: m.dose, route: m.route, instructions: m.instr, timesOfDay: m.times, daysOfWeek: [], startDate: d(startDate) },
      });
      const times = expandSchedule({ timesOfDay: m.times, daysOfWeek: [], startDate }, TZ, new Date(now.getTime() - 30 * 86400_000), new Date(now.getTime() + 2 * 86400_000));
      await db.medicationIntake.createMany({
        data: times.map((t) => {
          if (t.getTime() > now.getTime()) return { planId: mp.id, scheduledFor: t };
          const roll = rand();
          if (roll < ps.adherence) return { planId: mp.id, scheduledFor: t, status: "TAKEN" as const, takenAt: new Date(t.getTime() + Math.floor(rand() * 40) * 60_000), recordedAt: t };
          if (roll < ps.adherence + (1 - ps.adherence) / 2) return { planId: mp.id, scheduledFor: t, status: "SKIPPED" as const, note: "Felt unwell", recordedAt: t };
          return { planId: mp.id, scheduledFor: t, status: "MISSED" as const };
        }),
      });
    }

    const routineDefs = [
      { title: "Drink 2L of water", kind: "HYDRATION" as const },
      { title: "30-minute walk", kind: "ACTIVITY" as const },
      ...(idx === 0 ? [{ title: "Check feet daily (care team)", kind: "CLINICIAN_TASK" as const }] : []),
    ];
    for (const r of routineDefs) {
      const rd = await db.routineDefinition.create({ data: { patientId: pid, carePlanId: r.kind === "CLINICIAN_TASK" ? plan.id : null, createdByUserId: r.kind === "CLINICIAN_TASK" ? proUser.id : u.id, title: r.title, kind: r.kind, clinicianDefined: r.kind === "CLINICIAN_TASK", daysOfWeek: [], timeOfDay: "18:00" } });
      for (let k = 0; k < 30; k++) if (rand() < 0.7 + ps.adherence * 0.25) await db.routineCompletion.create({ data: { routineId: rd.id, localDate: addDaysToLocalDate(today, -k) } });
    }

    for (let k = 0; k < 14; k += 2) {
      const at = new Date(now.getTime() - k * 86400_000);
      await db.journalEntry.create({ data: { patientId: pid, recordedAt: at, wellbeing: 2 + Math.floor(rand() * 4), painScore: Math.floor(rand() * 5), symptoms: rand() < 0.3 ? ["Headache"] : [], text: rand() < 0.5 ? "Synthetic demo entry." : null, sharedWithTeam: true } });
      await db.measurement.create({ data: { patientId: pid, type: "BLOOD_PRESSURE", value: 118 + Math.round(rand() * 22), value2: 74 + Math.round(rand() * 12), unit: "mmHg", recordedAt: at } });
      await db.measurement.create({ data: { patientId: pid, type: "WEIGHT", value: Math.round((78 + rand() * 2) * 10) / 10, unit: "kg", recordedAt: at } });
    }

    await db.appointment.create({ data: { patientId: pid, professionalId: proId, title: "Follow-up consultation", startsAt: new Date(now.getTime() + (3 + idx) * 86400_000), endsAt: new Date(now.getTime() + (3 + idx) * 86400_000 + 30 * 60_000), status: "CONFIRMED", requestedBy: "PROFESSIONAL", location: "Demo clinic, room 2" } });
    await db.appointment.create({ data: { patientId: pid, professionalId: proId, title: "Initial assessment", startsAt: new Date(now.getTime() - 35 * 86400_000), endsAt: new Date(now.getTime() - 35 * 86400_000 + 45 * 60_000), status: "COMPLETED", requestedBy: "PROFESSIONAL", sharedNotes: "Plan agreed. Review in 4–6 weeks." } });
    if (idx === 1) {
      await db.followUpTask.create({ data: { patientId: pid, createdById: proId, assigneeId: proId, title: "Call to discuss missed evening doses", dueAt: new Date(now.getTime() - 86400_000) } });
      await db.internalNote.create({ data: { patientId: pid, authorId: proId, body: "Internal: consider reviewing dose timing at next visit." } });
    }
  }
}
