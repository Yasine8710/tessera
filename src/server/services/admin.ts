import type { AccountStatus } from "@prisma/client";
import { type Actor, requireAdmin, requireWritableAdmin } from "../access";
import { audit } from "../audit";
import { db } from "../db";
import { conflict, forbidden, invalid, notFound } from "../errors";
import { issueResetLink } from "./auth";
import { notify } from "./notifications";
import { dedupeKey } from "@/domain/rules";

/**
 * Admin duties: account lifecycle, professional verification, audit review.
 * Deliberately no function here reads clinical records.
 */

export async function listUsers(actor: Actor, opts: { q?: string; status?: AccountStatus; page?: number } = {}) {
  requireAdmin(actor);
  const pageSize = 25;
  const page = Math.max(opts.page ?? 1, 1);
  const where = {
    deletedAt: null,
    ...(actor.isDemo ? { isDemo: true } : {}),
    ...(opts.status ? { status: opts.status } : {}),
    ...(opts.q ? { OR: [{ name: { contains: opts.q } }, { email: { contains: opts.q } }] } : {}),
  };
  const [total, rows] = await Promise.all([
    db.user.count({ where }),
    db.user.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      select: { id: true, name: true, email: true, role: true, status: true, emailVerifiedAt: true, createdAt: true, isDemo: true, professionalProfile: { select: { profession: true, licenseNumber: true, licenseRegion: true, verifiedAt: true } } },
    }),
  ]);
  return { total, page, pageSize, rows };
}

export async function pendingProfessionals(actor: Actor) {
  requireAdmin(actor);
  return db.user.findMany({
    where: { role: "PROFESSIONAL", status: "PENDING_APPROVAL", deletedAt: null, ...(actor.isDemo ? { isDemo: true } : {}) },
    orderBy: { createdAt: "asc" },
    select: { id: true, name: true, email: true, createdAt: true, emailVerifiedAt: true, professionalProfile: true },
  });
}

export async function approveProfessional(actor: Actor, userId: string) {
  requireWritableAdmin(actor);
  const u = await db.user.findFirst({ where: { id: userId, role: "PROFESSIONAL" }, include: { professionalProfile: true } });
  if (!u?.professionalProfile) throw notFound();
  if (u.status !== "PENDING_APPROVAL") throw conflict("This account is not awaiting approval.");
  await db.$transaction(async (tx) => {
    await tx.user.update({ where: { id: userId }, data: { status: "ACTIVE" } });
    await tx.professionalProfile.update({ where: { userId }, data: { verifiedAt: new Date(), verifiedById: actor.userId } });
    await audit(actor.userId, "admin.professional_approved", "User", userId, undefined, tx);
  });
  await notify(userId, "SYSTEM", { title: "Your account was approved", body: "You can now use the staff portal.", link: "/staff", key: dedupeKey("APPROVED", userId) });
}

export async function rejectProfessional(actor: Actor, userId: string) {
  requireWritableAdmin(actor);
  const u = await db.user.findFirst({ where: { id: userId, role: "PROFESSIONAL", status: "PENDING_APPROVAL" } });
  if (!u) throw notFound();
  await db.user.update({ where: { id: userId }, data: { status: "SUSPENDED" } });
  await audit(actor.userId, "admin.professional_rejected", "User", userId);
}

export async function setUserStatus(actor: Actor, userId: string, status: "ACTIVE" | "SUSPENDED") {
  requireWritableAdmin(actor);
  if (userId === actor.userId) throw invalid("You cannot change your own status.");
  const u = await db.user.findUnique({ where: { id: userId } });
  if (!u) throw notFound();
  if (u.role === "ADMIN") throw invalid("Administrator accounts are managed through the CLI.");
  if (status === "ACTIVE" && u.role === "PROFESSIONAL") {
    const prof = await db.professionalProfile.findUnique({ where: { userId } });
    if (!prof?.verifiedAt) throw invalid("Approve this professional before activating.");
  }
  await db.$transaction([
    db.user.update({ where: { id: userId }, data: { status } }),
    ...(status === "SUSPENDED" ? [db.session.deleteMany({ where: { userId } })] : []),
  ]);
  await audit(actor.userId, status === "SUSPENDED" ? "admin.user_suspended" : "admin.user_reactivated", "User", userId);
}

export async function listAudit(actor: Actor, opts: { action?: string; page?: number } = {}) {
  requireAdmin(actor);
  const pageSize = 50;
  const page = Math.max(opts.page ?? 1, 1);
  const where = { ...(opts.action ? { action: { startsWith: opts.action } } : {}), ...(actor.isDemo ? { actor: { isDemo: true } } : {}) };
  const [total, rows] = await Promise.all([
    db.auditEvent.count({ where }),
    db.auditEvent.findMany({ where, orderBy: { createdAt: "desc" }, skip: (page - 1) * pageSize, take: pageSize, include: { actor: { select: { name: true, role: true } } } }),
  ]);
  return { total, page, pageSize, rows };
}

export async function platformMetrics(actor: Actor) {
  requireAdmin(actor);
  const demo = actor.isDemo ? { isDemo: true } : {};
  const [users, byRole, pending, suspended, activeSessions, failedLogins24h] = await Promise.all([
    db.user.count({ where: { deletedAt: null, ...demo } }),
    db.user.groupBy({ by: ["role"], where: { deletedAt: null, ...demo }, _count: true }),
    db.user.count({ where: { status: "PENDING_APPROVAL", ...demo } }),
    db.user.count({ where: { status: "SUSPENDED", ...demo } }),
    db.session.count({ where: { expiresAt: { gt: new Date() }, ...(actor.isDemo ? { user: { isDemo: true } } : {}) } }),
    actor.isDemo ? Promise.resolve(0) : db.auditEvent.count({ where: { action: "auth.login_failed", createdAt: { gt: new Date(Date.now() - 86400_000) } } }),
  ]);
  return { users, byRole: Object.fromEntries(byRole.map((r) => [r.role, r._count])), pending, suspended, activeSessions, failedLogins24h };
}

export async function getSettings(actor: Actor) {
  requireAdmin(actor);
  const rows = await db.appSetting.findMany();
  return Object.fromEntries(rows.map((r) => [r.key, r.value]));
}

export async function setSetting(actor: Actor, key: "staleDays" | "supportEmail" | "demoEnabled", value: string | number | boolean) {
  requireWritableAdmin(actor);
  if (key === "staleDays" && !(typeof value === "number" && value >= 1 && value <= 30)) throw invalid("Stale days must be 1–30.");
  if (key === "demoEnabled" && typeof value !== "boolean") throw invalid("Demo setting must be on or off.");
  await db.appSetting.upsert({ where: { key }, create: { key, value }, update: { value } });
  await audit(actor.userId, "admin.setting_changed", "AppSetting", key);
}

export async function createOrganization(actor: Actor, name: string) {
  requireWritableAdmin(actor);
  if (name.trim().length < 2) throw invalid("Enter a name.");
  const o = await db.organization.create({ data: { name: name.trim() } });
  await audit(actor.userId, "admin.org_created", "Organization", o.id);
  return o;
}

export async function addOrgMember(actor: Actor, orgId: string, userEmail: string, title?: string) {
  requireWritableAdmin(actor);
  const u = await db.user.findFirst({ where: { email: userEmail.toLowerCase(), role: "PROFESSIONAL" } });
  if (!u) throw notFound("No professional with that email.");
  await db.orgMembership.upsert({ where: { orgId_userId: { orgId, userId: u.id } }, create: { orgId, userId: u.id, title }, update: { title } });
  await audit(actor.userId, "admin.org_member_added", "Organization", orgId);
}

export async function listOrganizations(actor: Actor) {
  requireAdmin(actor);
  if (actor.isDemo) return [];
  return db.organization.findMany({ include: { members: { include: { user: { select: { name: true, email: true } } } } }, orderBy: { name: "asc" } });
}

/** Desktop (no email): lets an administrator hand a user a one-time reset link. Never for other admins. */
export async function issueUserResetLink(actor: Actor, userId: string) {
  requireWritableAdmin(actor);
  const target = await db.user.findUnique({ where: { id: userId } });
  if (!target || target.deletedAt) throw notFound("User not found.");
  if (target.role === "ADMIN") throw forbidden("Administrator passwords cannot be reset from here.");
  const r = await issueResetLink(userId);
  await audit(actor.userId, "admin.reset_link_issued", "User", userId);
  return { path: r.path, minutes: r.minutes };
}
