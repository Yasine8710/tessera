import { randomUUID } from "node:crypto";
import { describe, expect, it } from "vitest";
import { db } from "@/server/db";
import { hashToken } from "@/server/security";
import * as admin from "@/server/services/admin";
import * as auth from "@/server/services/auth";
import * as care from "@/server/services/care";
import * as clinical from "@/server/services/clinical";
import * as messaging from "@/server/services/messaging";
import * as notifications from "@/server/services/notifications";
import * as patientSvc from "@/server/services/patient";
import * as staff from "@/server/services/staff";
import { ALL_CONSENTS, PASSWORD, actorFor, makeAdmin, makePatient, makeProfessional, uniq } from "./helpers";

async function linked(consents: Record<string, boolean> = ALL_CONSENTS) {
  const pro = await makeProfessional();
  const pat = await makePatient();
  const inv = await care.createInvitation(pro.actor, { patientEmail: pat.email });
  const token = inv.acceptUrl.split("/").pop()!;
  await care.acceptInvitation(pat.actor, { token }, consents);
  return { pro, pat, token };
}

const plan = { title: "Plan A", instructions: "Follow schedule", startDate: "2026-01-01" };
const med = { medicationName: "Metformin", dose: "500 mg", timesOfDay: ["08:00", "20:00"], daysOfWeek: [], startDate: "2026-01-01" };

describe("authentication", () => {
  it("registers, logs in, rejects bad password, and signs out", async () => {
    const p = await makePatient();
    await expect(auth.login({ email: p.email, password: "wrong-password-1" }, randomUUID())).rejects.toThrow(/Incorrect/);
    const s = await auth.login({ email: p.email, password: PASSWORD }, randomUUID());
    expect((await auth.actorFromSession(s.token))?.userId).toBe(p.userId);
    await auth.logout(s.token);
    expect(await auth.actorFromSession(s.token)).toBeNull();
  });

  it("rejects duplicate email and weak password", async () => {
    const p = await makePatient();
    await expect(auth.registerPatient({ name: "X Y", email: p.email, password: PASSWORD, timezone: "UTC", acceptTerms: true }, randomUUID())).rejects.toThrow(/already exists/);
    await expect(auth.registerPatient({ name: "X Y", email: uniq("w"), password: "short", timezone: "UTC", acceptTerms: true }, randomUUID())).rejects.toThrow();
  });

  it("professionals start unapproved and get no staff powers", async () => {
    const pro = await makeProfessional(false);
    expect(pro.actor.professionalId).toBeUndefined();
    const u = await db.user.findUniqueOrThrow({ where: { id: pro.userId } });
    expect(u.status).toBe("PENDING_APPROVAL");
    await expect(care.createInvitation(pro.actor, { patientEmail: uniq("x") })).rejects.toThrow(/verified/);
  });

  it("role cannot be supplied by the client", async () => {
    const email = uniq("sneaky");
    await auth.registerPatient({ name: "Sneaky One", email, password: PASSWORD, timezone: "UTC", acceptTerms: true, role: "ADMIN" } as never, randomUUID());
    expect((await db.user.findUniqueOrThrow({ where: { email } })).role).toBe("PATIENT");
  });

  it("suspended accounts cannot sign in", async () => {
    const p = await makePatient();
    await db.user.update({ where: { id: p.userId }, data: { status: "SUSPENDED" } });
    await expect(auth.login({ email: p.email, password: PASSWORD }, randomUUID())).rejects.toThrow(/suspended/);
  });

  it("rate limits repeated failed logins", async () => {
    const p = await makePatient();
    const ip = randomUUID();
    for (let i = 0; i < 8; i++) await auth.login({ email: p.email, password: "nope-nope-nope" }, ip).catch(() => undefined);
    await expect(auth.login({ email: p.email, password: PASSWORD }, ip)).rejects.toThrow(/Too many/);
  });

  it("password reset works once, ends sessions, hides account existence", async () => {
    const p = await makePatient();
    const s = await auth.login({ email: p.email, password: PASSWORD }, randomUUID());
    await expect(auth.requestPasswordReset({ email: uniq("ghost") }, randomUUID())).resolves.toBeUndefined();
    await auth.requestPasswordReset({ email: p.email }, randomUUID());
    // Plant a known token (the real one only exists in the email).
    const token = `known-reset-token-${randomUUID()}`;
    await db.authToken.create({ data: { userId: p.userId, purpose: "PASSWORD_RESET", tokenHash: hashToken(token), expiresAt: new Date(Date.now() + 60_000) } });
    await auth.resetPassword({ token, password: "brand-new-password-9" });
    expect(await auth.actorFromSession(s.token)).toBeNull();
    await expect(auth.resetPassword({ token, password: "another-password-9" })).rejects.toThrow(/invalid or has expired/);
    await expect(auth.login({ email: p.email, password: PASSWORD }, randomUUID())).rejects.toThrow();
    await expect(auth.login({ email: p.email, password: "brand-new-password-9" }, randomUUID())).resolves.toBeTruthy();
  });
});

describe("care relationships and access control", () => {
  it("staff cannot see a patient before a relationship exists", async () => {
    const pro = await makeProfessional();
    const pat = await makePatient();
    await expect(staff.patientProfileForStaff(pro.actor, pat.actor.patientId!)).rejects.toThrow(/Not found/);
    await expect(clinical.listCarePlans(pro.actor, pat.actor.patientId!)).rejects.toThrow(/Not found/);
  });

  it("invitation is single-use and bound to the invited email", async () => {
    const pro = await makeProfessional();
    const pat = await makePatient();
    const other = await makePatient();
    const inv = await care.createInvitation(pro.actor, { patientEmail: pat.email });
    const token = inv.acceptUrl.split("/").pop()!;
    await expect(care.acceptInvitation(other.actor, { token }, ALL_CONSENTS)).rejects.toThrow(/different email/);
    await care.acceptInvitation(pat.actor, { token }, ALL_CONSENTS);
    await expect(care.acceptInvitation(pat.actor, { token }, ALL_CONSENTS)).rejects.toThrow(/invalid, expired, or already used/);
  });

  it("concurrent acceptance succeeds exactly once", async () => {
    const pro = await makeProfessional();
    const pat = await makePatient();
    const inv = await care.createInvitation(pro.actor, { patientEmail: pat.email });
    const token = inv.acceptUrl.split("/").pop()!;
    const results = await Promise.allSettled([1, 2, 3].map(() => care.acceptInvitation(pat.actor, { token }, ALL_CONSENTS)));
    expect(results.filter((r) => r.status === "fulfilled")).toHaveLength(1);
  });

  it("expired and revoked invitations are unusable", async () => {
    const pro = await makeProfessional();
    const pat = await makePatient();
    const a = await care.createInvitation(pro.actor, { patientEmail: pat.email });
    await db.invitation.update({ where: { id: a.invitationId }, data: { expiresAt: new Date(Date.now() - 1000) } });
    await expect(care.acceptInvitation(pat.actor, { token: a.acceptUrl.split("/").pop()! }, ALL_CONSENTS)).rejects.toThrow();
    const b = await care.createInvitation(pro.actor, { patientEmail: pat.email });
    await care.revokeInvitation(pro.actor, b.invitationId);
    expect(await care.previewInvitation(b.acceptUrl.split("/").pop()!)).toBeNull();
  });

  it("a different professional cannot read a linked patient", async () => {
    const { pat } = await linked();
    const stranger = await makeProfessional();
    await expect(staff.patientProfileForStaff(stranger.actor, pat.actor.patientId!)).rejects.toThrow(/Not found/);
    await expect(patientSvc.listJournal(stranger.actor, { patientId: pat.actor.patientId })).rejects.toThrow(/Not found/);
  });

  it("consent gates data categories; admins never read clinical data", async () => {
    const { pro, pat } = await linked({ JOURNAL: false, MEDICATION_ADHERENCE: false });
    await patientSvc.addJournalEntry(pat.actor, { symptoms: ["Cough"], sharedWithTeam: true });
    await expect(patientSvc.listJournal(pro.actor, { patientId: pat.actor.patientId })).rejects.toThrow(/not shared/);
    await expect(staff.adherenceReport(pro.actor, pat.actor.patientId!, 7)).rejects.toThrow(/not shared/);
    const rel = (await care.listCareTeam(pat.actor))[0];
    await care.updateConsents(pat.actor, rel.id, { JOURNAL: true });
    const j = await patientSvc.listJournal(pro.actor, { patientId: pat.actor.patientId });
    expect(j.total).toBe(1);
    const adm = await makeAdmin();
    await expect(staff.patientProfileForStaff(adm.actor, pat.actor.patientId!)).rejects.toThrow();
    await expect(patientSvc.listJournal(adm.actor, { patientId: pat.actor.patientId })).rejects.toThrow();
  });

  it("private journal entries are never shown to staff", async () => {
    const { pro, pat } = await linked();
    await patientSvc.addJournalEntry(pat.actor, { symptoms: [], text: "private thought", sharedWithTeam: false });
    expect((await patientSvc.listJournal(pro.actor, { patientId: pat.actor.patientId })).total).toBe(0);
    expect((await patientSvc.listJournal(pat.actor)).total).toBe(1);
  });

  it("ending a relationship stops access and messaging but keeps history", async () => {
    const { pro, pat } = await linked();
    const [convo] = await messaging.listConversations(pat.actor);
    await messaging.sendMessage(pat.actor, { conversationId: convo.id, body: "hello" });
    const rel = (await care.listCareTeam(pat.actor))[0];
    await care.endRelationship(pat.actor, rel.id);
    await expect(staff.patientProfileForStaff(pro.actor, pat.actor.patientId!)).rejects.toThrow();
    await expect(messaging.sendMessage(pat.actor, { conversationId: convo.id, body: "again" })).rejects.toThrow(/no longer active/);
    expect(await db.message.count({ where: { conversationId: convo.id } })).toBe(1);
  });
});

describe("care plans, medications and dose records", () => {
  it("creates a versioned plan, requires a reason to update, and keeps history", async () => {
    const { pro, pat } = await linked();
    const p = await clinical.createCarePlan(pro.actor, pat.actor.patientId!, plan);
    await expect(clinical.updateCarePlan(pro.actor, p.id, { ...plan, instructions: "New" })).rejects.toThrow();
    await clinical.updateCarePlan(pro.actor, p.id, { ...plan, instructions: "New instructions", reason: "Adjusted after review" });
    const [loaded] = await clinical.listCarePlans(pat.actor, pat.actor.patientId!);
    expect(loaded.version).toBe(2);
    expect(loaded.versions.map((v) => v.version)).toEqual([2, 1]);
    expect(loaded.versions[0].reason).toBe("Adjusted after review");
    expect(await db.auditEvent.count({ where: { action: "careplan.update", entityId: p.id } })).toBe(1);
  });

  it("only the authoring professional can change a plan", async () => {
    const { pro, pat } = await linked();
    const colleague = await makeProfessional();
    const inv = await care.createInvitation(colleague.actor, { patientEmail: pat.email });
    await care.acceptInvitation(pat.actor, { token: inv.acceptUrl.split("/").pop()! }, ALL_CONSENTS);
    const p = await clinical.createCarePlan(pro.actor, pat.actor.patientId!, plan);
    await expect(clinical.updateCarePlan(colleague.actor, p.id, { ...plan, title: "Hijack", reason: "because" })).rejects.toThrow(/authoring/);
    await expect(clinical.addMedicationToPlan(colleague.actor, p.id, med)).rejects.toThrow(/authoring/);
  });

  it("patients cannot create or alter prescriptions", async () => {
    const { pro, pat } = await linked();
    const p = await clinical.createCarePlan(pro.actor, pat.actor.patientId!, plan);
    await expect(clinical.addMedicationToPlan(pat.actor, p.id, med)).rejects.toThrow();
    await expect(clinical.updateCarePlan(pat.actor, p.id, { ...plan, reason: "me" })).rejects.toThrow();
    const mp = await clinical.addMedicationToPlan(pro.actor, p.id, med);
    await expect(clinical.stopMedicationPlan(pat.actor, mp.id, "I want to stop")).rejects.toThrow();
    const cr = await clinical.createChangeRequest(pat.actor, { planId: mp.id, message: "Can I take it later?" });
    const stored = await db.medicationPlan.findUniqueOrThrow({ where: { id: mp.id } });
    expect(stored.dose).toBe("500 mg");
    await clinical.resolveChangeRequest(pro.actor, cr.id, "Please keep the current times.");
  });

  it("patient records a dose; MISSED and future doses cannot be self-reported", async () => {
    const { pro, pat } = await linked();
    const p = await clinical.createCarePlan(pro.actor, pat.actor.patientId!, { ...plan, startDate: "2020-01-01" });
    await clinical.addMedicationToPlan(pro.actor, p.id, { ...med, startDate: "2020-01-01" });
    const now = new Date();
    const doses = await clinical.listDoses(pat.actor, { fromDays: 1, toDays: 1, now });
    expect(doses.length).toBeGreaterThan(0);
    const past = doses.find((d) => d.scheduledFor < now)!;
    const future = doses.find((d) => d.scheduledFor.getTime() > now.getTime() + 3 * 3600_000);
    await expect(clinical.reportIntake(pat.actor, { intakeId: past.id, status: "MISSED" })).rejects.toThrow();
    await clinical.reportIntake(pat.actor, { intakeId: past.id, status: "SKIPPED", note: "Nausea" });
    expect((await db.medicationIntake.findUniqueOrThrow({ where: { id: past.id } })).status).toBe("SKIPPED");
    if (future) await expect(clinical.reportIntake(pat.actor, { intakeId: future.id, status: "TAKEN" })).rejects.toThrow(/not due/);
    const other = await makePatient();
    await expect(clinical.reportIntake(other.actor, { intakeId: past.id, status: "TAKEN" })).rejects.toThrow();
  });

  it("staff see reported adherence for a consenting patient", async () => {
    const { pro, pat } = await linked();
    const p = await clinical.createCarePlan(pro.actor, pat.actor.patientId!, { ...plan, startDate: "2020-01-01" });
    await clinical.addMedicationToPlan(pro.actor, p.id, { ...med, timesOfDay: ["00:05"], startDate: "2020-01-01" });
    const doses = await clinical.listDoses(pat.actor, { fromDays: 1, toDays: 0 });
    const past = doses.find((d) => d.scheduledFor < new Date())!;
    await clinical.reportIntake(pat.actor, { intakeId: past.id, status: "TAKEN" });
    const r = await staff.adherenceReport(pro.actor, pat.actor.patientId!, 3);
    expect(r.totals.taken).toBeGreaterThanOrEqual(1);
  });
});

describe("messaging", () => {
  it("only participants can read or write", async () => {
    const { pat } = await linked();
    const [convo] = await messaging.listConversations(pat.actor);
    const outsider = await makePatient();
    await expect(messaging.getMessages(outsider.actor, convo.id)).rejects.toThrow();
    await expect(messaging.sendMessage(outsider.actor, { conversationId: convo.id, body: "hi" })).rejects.toThrow();
  });

  it("tracks unread, notifies without leaking content, and audits without bodies", async () => {
    const { pro, pat } = await linked();
    const [convo] = await messaging.listConversations(pat.actor);
    await messaging.sendMessage(pat.actor, { conversationId: convo.id, body: "secret symptoms text" });
    const [seen] = await messaging.listConversations(pro.actor);
    expect(seen.unread).toBe(1);
    await messaging.getMessages(pro.actor, convo.id);
    expect((await messaging.listConversations(pro.actor))[0].unread).toBe(0);
    const n = await db.notification.findFirstOrThrow({ where: { userId: pro.userId, type: "MESSAGE" } });
    expect(n.body).not.toContain("secret");
    const ev = await db.auditEvent.findFirstOrThrow({ where: { action: "message.send", actorId: pat.userId } });
    expect(JSON.stringify(ev)).not.toContain("secret");
  });

  it("internal notes are staff-only", async () => {
    const { pro, pat } = await linked();
    await staff.addInternalNote(pro.actor, { patientId: pat.actor.patientId, body: "internal only" });
    expect((await staff.listInternalNotes(pro.actor, pat.actor.patientId!)).length).toBe(1);
    await expect(staff.listInternalNotes(pat.actor, pat.actor.patientId!)).rejects.toThrow();
  });
});

describe("appointments", () => {
  it("patient requests; only staff confirm; patient can only request changes", async () => {
    const { pro, pat } = await linked();
    const a = await patientSvc.requestAppointment(pat.actor, {
      professionalId: pro.actor.professionalId, title: "Check-up", startsAt: new Date(Date.now() + 86400_000).toISOString(), durationMin: 30,
    });
    expect(a.status).toBe("REQUESTED");
    await expect(patientSvc.staffAppointmentUpdate(pat.actor, a.id, "CONFIRMED")).rejects.toThrow();
    await patientSvc.staffAppointmentUpdate(pro.actor, a.id, "CONFIRMED");
    await patientSvc.patientAppointmentAction(pat.actor, a.id, "RESCHEDULE");
    expect((await db.appointment.findUniqueOrThrow({ where: { id: a.id } })).status).toBe("RESCHEDULE_REQUESTED");
    await expect(patientSvc.staffAppointmentUpdate(pro.actor, a.id, "COMPLETED")).rejects.toThrow(/Cannot move/);
  });
});

describe("notifications, tasks and admin", () => {
  it("reminder job is idempotent", async () => {
    const { pro, pat } = await linked();
    const p = await clinical.createCarePlan(pro.actor, pat.actor.patientId!, { ...plan, startDate: "2020-01-01" });
    await clinical.addMedicationToPlan(pro.actor, p.id, { ...med, timesOfDay: ["00:01"], startDate: "2020-01-01" });
    await notifications.runReminderJob();
    const before = await db.notification.count({ where: { userId: pat.userId } });
    const again = await notifications.runReminderJob();
    expect(again.created).toBe(0);
    expect(await db.notification.count({ where: { userId: pat.userId } })).toBe(before);
  });

  it("respects notification preferences", async () => {
    const pat = await makePatient();
    await notifications.updatePreferences(pat.actor, { messageAlerts: false });
    expect(await notifications.notify(pat.userId, "MESSAGE", { title: "t", body: "b", key: "k1" })).toBe(false);
    expect(await notifications.notify(pat.userId, "SYSTEM", { title: "t", body: "b", key: "k2" })).toBe(true);
    expect(await notifications.notify(pat.userId, "SYSTEM", { title: "t", body: "b", key: "k2" })).toBe(false);
  });

  it("tasks: create, overdue monitoring flag, complete", async () => {
    const { pro, pat } = await linked();
    await staff.createTask(pro.actor, { patientId: pat.actor.patientId, title: "Call patient", dueAt: new Date(Date.now() - 3600_000).toISOString() });
    const flags = await staff.monitoring(pro.actor);
    expect(flags.some((f) => f.kind === "overdue_task" && f.patientId === pat.actor.patientId)).toBe(true);
    const [t] = await staff.listTasks(pro.actor, { patientId: pat.actor.patientId });
    await staff.completeTask(pro.actor, t.id);
    expect((await staff.monitoring(pro.actor)).some((f) => f.kind === "overdue_task")).toBe(false);
  });

  it("admin approves professionals; non-admins cannot", async () => {
    const adm = await makeAdmin();
    const pro = await makeProfessional(false);
    const pat = await makePatient();
    await expect(admin.approveProfessional(pat.actor, pro.userId)).rejects.toThrow();
    await expect(admin.approveProfessional(pro.actor, pro.userId)).rejects.toThrow();
    await admin.approveProfessional(adm.actor, pro.userId);
    expect((await actorFor(pro.userId)).professionalId).toBeTruthy();
    await admin.setUserStatus(adm.actor, pro.userId, "SUSPENDED");
    await expect(auth.login({ email: pro.email, password: PASSWORD }, randomUUID())).rejects.toThrow(/suspended/);
  });

  it("CSV export includes only consenting patients and neutralises formulas", async () => {
    const { pro } = await linked();
    const hidden = await makePatient("=cmd|calc");
    const inv = await care.createInvitation(pro.actor, { patientEmail: hidden.email });
    await care.acceptInvitation(hidden.actor, { token: inv.acceptUrl.split("/").pop()! }, { MEDICATION_ADHERENCE: false });
    const csv = await staff.adherenceCsv(pro.actor, 30);
    expect(csv).not.toContain("=cmd");
    expect(csv.split("\n")[0]).toContain("adherence_percent");
    expect(csv).not.toContain("@test.invalid");
  });
});
