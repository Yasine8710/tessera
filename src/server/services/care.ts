import type { ConsentType, Prisma } from "@prisma/client";
import { INVITATION_TTL_DAYS, dedupeKey, invitationUsable } from "@/domain/rules";
import { inviteSchema } from "@/lib/schemas";
import { type Actor, requirePatient, requireProfessional } from "../access";
import { audit } from "../audit";
import { db } from "../db";
import { conflict, forbidden, invalid, notFound } from "../errors";
import { appUrl, sendMail } from "../mail";
import { hashToken, newToken } from "../security";
import { notify } from "./notifications";

export const CONSENT_TYPES: ConsentType[] = ["JOURNAL", "MEASUREMENTS", "ROUTINES", "MEDICATION_ADHERENCE"];
export type ConsentChoice = Partial<Record<ConsentType, boolean>>;

async function activateRelationship(
  tx: Prisma.TransactionClient,
  patientId: string,
  professionalId: string,
  initiatedBy: "PATIENT" | "PROFESSIONAL",
  consents: ConsentChoice,
) {
  const rel = await tx.careRelationship.upsert({
    where: { patientId_professionalId: { patientId, professionalId } },
    create: { patientId, professionalId, initiatedBy, status: "ACTIVE", startedAt: new Date() },
    update: { status: "ACTIVE", startedAt: new Date(), endedAt: null, endRequested: false },
  });
  for (const type of CONSENT_TYPES) {
    await tx.consent.upsert({
      where: { relationshipId_type: { relationshipId: rel.id, type } },
      create: { relationshipId: rel.id, type, granted: !!consents[type] },
      update: { granted: !!consents[type] },
    });
  }
  const [p, pro] = await Promise.all([
    tx.patientProfile.findUniqueOrThrow({ where: { id: patientId }, select: { userId: true } }),
    tx.professionalProfile.findUniqueOrThrow({ where: { id: professionalId }, select: { userId: true } }),
  ]);
  const convo = await tx.conversation.upsert({
    where: { patientId_professionalId: { patientId, professionalId } },
    create: { patientId, professionalId },
    update: {},
  });
  for (const userId of [p.userId, pro.userId]) {
    await tx.conversationParticipant.upsert({
      where: { conversationId_userId: { conversationId: convo.id, userId } },
      create: { conversationId: convo.id, userId },
      update: {},
    });
  }
  return rel;
}

// ---------------- Invitations (professional -> patient) ----------------

export async function createInvitation(actor: Actor, raw: unknown) {
  const professionalId = requireProfessional(actor);
  const { patientEmail } = inviteSchema.parse(raw);
  const token = newToken();
  const patientUser = await db.user.findUnique({
    where: { email: patientEmail },
    include: { patientProfile: true },
  });
  const inv = await db.invitation.create({
    data: {
      tokenHash: hashToken(token),
      professionalId,
      patientEmail,
      patientId: patientUser?.role === "PATIENT" ? patientUser.patientProfile?.id : null,
      expiresAt: new Date(Date.now() + INVITATION_TTL_DAYS * 86400_000),
    },
  });
  await audit(actor.userId, "invitation.create", "Invitation", inv.id);
  const acceptUrl = appUrl(`/invitations/${token}`);
  const sender = await db.user.findUniqueOrThrow({ where: { id: actor.userId }, select: { name: true } });
  const mail = await sendMail(
    patientEmail,
    `${sender.name} invited you to CareSync`,
    `${sender.name} invited you to connect on CareSync. You choose what to share.\n${acceptUrl}\nThis link expires in ${INVITATION_TTL_DAYS} days and works once.`,
  );
  if (patientUser?.role === "PATIENT") {
    await notify(patientUser.id, "INVITATION", {
      title: "New care-team invitation",
      body: `${sender.name} invited you to connect.`,
      link: "/patient/care-team",
      key: dedupeKey("INVITATION", inv.id),
    });
  }
  // The raw token is returned once so the sender can share the link if email is not configured.
  return { invitationId: inv.id, acceptUrl, emailDelivered: mail.delivered };
}

export async function revokeInvitation(actor: Actor, invitationId: string) {
  const professionalId = requireProfessional(actor);
  const r = await db.invitation.updateMany({
    where: { id: invitationId, professionalId, status: "PENDING" },
    data: { status: "REVOKED" },
  });
  if (r.count === 0) throw notFound("Invitation not found or no longer pending.");
  await audit(actor.userId, "invitation.revoke", "Invitation", invitationId);
}

export async function previewInvitation(token: string) {
  const inv = await db.invitation.findUnique({
    where: { tokenHash: hashToken(token) },
    include: { professional: { include: { user: { select: { name: true } } } } },
  });
  if (!inv || !invitationUsable(inv, new Date())) return null;
  return {
    id: inv.id,
    patientEmail: inv.patientEmail,
    professionalName: inv.professional.user.name,
    profession: inv.professional.profession,
    expiresAt: inv.expiresAt,
  };
}

export async function acceptInvitation(actor: Actor, ref: { token?: string; invitationId?: string }, consents: ConsentChoice) {
  const patientId = requirePatient(actor);
  const me = await db.user.findUniqueOrThrow({ where: { id: actor.userId }, select: { email: true } });
  const where = ref.token ? { tokenHash: hashToken(ref.token) } : ref.invitationId ? { id: ref.invitationId } : null;
  if (!where) throw invalid("Missing invitation.");
  const inv = await db.invitation.findUnique({ where });
  if (!inv || !invitationUsable(inv, new Date())) throw invalid("This invitation is invalid, expired, or already used.");
  if (inv.patientEmail !== me.email) throw forbidden("This invitation was sent to a different email address.");

  const rel = await db.$transaction(async (tx) => {
    // Atomic single-use: only one concurrent accept can flip PENDING -> ACCEPTED.
    const claimed = await tx.invitation.updateMany({
      where: { id: inv.id, status: "PENDING", usedAt: null, expiresAt: { gt: new Date() } },
      data: { status: "ACCEPTED", usedAt: new Date(), patientId },
    });
    if (claimed.count !== 1) throw conflict("This invitation was already used.");
    return activateRelationship(tx, patientId, inv.professionalId, "PROFESSIONAL", consents);
  });
  await audit(actor.userId, "invitation.accept", "CareRelationship", rel.id);
  const pro = await db.professionalProfile.findUniqueOrThrow({ where: { id: inv.professionalId }, select: { userId: true } });
  await notify(pro.userId, "SYSTEM", {
    title: "Invitation accepted",
    body: "A patient accepted your invitation.",
    link: `/staff/patients/${patientId}`,
    key: dedupeKey("INV_ACCEPTED", inv.id),
  });
  return { relationshipId: rel.id };
}

export async function declineInvitation(actor: Actor, invitationId: string) {
  requirePatient(actor);
  const me = await db.user.findUniqueOrThrow({ where: { id: actor.userId }, select: { email: true } });
  const r = await db.invitation.updateMany({
    where: { id: invitationId, patientEmail: me.email, status: "PENDING" },
    data: { status: "DECLINED", usedAt: new Date() },
  });
  if (r.count === 0) throw notFound("Invitation not found.");
  await audit(actor.userId, "invitation.decline", "Invitation", invitationId);
}

export async function listInvitationsForPatient(actor: Actor) {
  requirePatient(actor);
  const me = await db.user.findUniqueOrThrow({ where: { id: actor.userId }, select: { email: true } });
  return db.invitation.findMany({
    where: { patientEmail: me.email, status: "PENDING", expiresAt: { gt: new Date() } },
    include: { professional: { include: { user: { select: { name: true } } } } },
    orderBy: { createdAt: "desc" },
  });
}

export async function listInvitationsSent(actor: Actor) {
  const professionalId = requireProfessional(actor);
  return db.invitation.findMany({
    where: { professionalId },
    orderBy: { createdAt: "desc" },
    take: 50,
    select: { id: true, patientEmail: true, status: true, expiresAt: true, createdAt: true },
  });
}

// ---------------- Connection requests (patient -> professional) ----------------

export async function requestConnection(actor: Actor, professionalEmail: string, consents: ConsentChoice) {
  const patientId = requirePatient(actor);
  const pro = await db.user.findFirst({
    where: { email: professionalEmail.trim().toLowerCase(), role: "PROFESSIONAL", status: "ACTIVE" },
    include: { professionalProfile: true },
  });
  if (!pro?.professionalProfile?.verifiedAt) throw notFound("No verified professional found with that email.");
  const existing = await db.careRelationship.findUnique({
    where: { patientId_professionalId: { patientId, professionalId: pro.professionalProfile.id } },
  });
  if (existing?.status === "ACTIVE") throw conflict("You are already connected.");
  if (existing?.status === "REQUESTED") throw conflict("A request is already pending.");
  const rel = await db.$transaction(async (tx) => {
    const r = await tx.careRelationship.upsert({
      where: { patientId_professionalId: { patientId, professionalId: pro.professionalProfile!.id } },
      create: { patientId, professionalId: pro.professionalProfile!.id, initiatedBy: "PATIENT", status: "REQUESTED" },
      update: { status: "REQUESTED", initiatedBy: "PATIENT", endedAt: null },
    });
    for (const type of CONSENT_TYPES) {
      await tx.consent.upsert({
        where: { relationshipId_type: { relationshipId: r.id, type } },
        create: { relationshipId: r.id, type, granted: !!consents[type] },
        update: { granted: !!consents[type] },
      });
    }
    return r;
  });
  await audit(actor.userId, "relationship.request", "CareRelationship", rel.id);
  await notify(pro.id, "INVITATION", {
    title: "New connection request",
    body: "A patient asked to connect with you.",
    link: "/staff/patients",
    key: dedupeKey("CONN_REQ", rel.id, rel.createdAt),
  });
  return { relationshipId: rel.id };
}

export async function respondToRequest(actor: Actor, relationshipId: string, accept: boolean) {
  const professionalId = requireProfessional(actor);
  const rel = await db.careRelationship.findFirst({
    where: { id: relationshipId, professionalId, status: "REQUESTED" },
    include: { consents: true },
  });
  if (!rel) throw notFound("Request not found.");
  if (!accept) {
    await db.careRelationship.update({ where: { id: rel.id }, data: { status: "REJECTED" } });
  } else {
    const consents: ConsentChoice = {};
    for (const c of rel.consents) consents[c.type] = c.granted;
    await db.$transaction((tx) => activateRelationship(tx, rel.patientId, professionalId, "PATIENT", consents));
  }
  await audit(actor.userId, accept ? "relationship.accept" : "relationship.reject", "CareRelationship", rel.id);
}

export async function listIncomingRequests(actor: Actor) {
  const professionalId = requireProfessional(actor);
  return db.careRelationship.findMany({
    where: { professionalId, status: "REQUESTED" },
    include: { patient: { include: { user: { select: { name: true, email: true } } } } },
  });
}

// ---------------- Ending + consent ----------------

/** Either party may end a relationship. History is preserved; access stops immediately. */
export async function endRelationship(actor: Actor, relationshipId: string) {
  const rel = await db.careRelationship.findUnique({ where: { id: relationshipId } });
  const mine =
    rel &&
    ((actor.role === "PATIENT" && rel.patientId === actor.patientId) ||
      (actor.role === "PROFESSIONAL" && rel.professionalId === actor.professionalId));
  if (!rel || !mine) throw notFound();
  if (rel.status !== "ACTIVE" && rel.status !== "REQUESTED") throw conflict("This connection is not active.");
  await db.careRelationship.update({ where: { id: rel.id }, data: { status: "ENDED", endedAt: new Date() } });
  await audit(actor.userId, "relationship.end", "CareRelationship", rel.id, { by: actor.role });
}

export async function updateConsents(actor: Actor, relationshipId: string, consents: ConsentChoice) {
  const patientId = requirePatient(actor);
  const rel = await db.careRelationship.findFirst({ where: { id: relationshipId, patientId } });
  if (!rel) throw notFound();
  for (const type of CONSENT_TYPES) {
    if (consents[type] === undefined) continue;
    await db.consent.upsert({
      where: { relationshipId_type: { relationshipId, type } },
      create: { relationshipId, type, granted: !!consents[type] },
      update: { granted: !!consents[type] },
    });
  }
  await audit(actor.userId, "consent.update", "CareRelationship", relationshipId);
}

// ---------------- Listings ----------------

export async function listCareTeam(actor: Actor) {
  const patientId = requirePatient(actor);
  return db.careRelationship.findMany({
    where: { patientId, status: { in: ["ACTIVE", "REQUESTED"] } },
    include: {
      consents: true,
      professional: { include: { user: { select: { name: true, email: true } } } },
    },
    orderBy: { createdAt: "asc" },
  });
}

export type PatientListQuery = { q?: string; page?: number; pageSize?: number; sort?: "name" | "recent" };

export async function listPatients(actor: Actor, query: PatientListQuery = {}) {
  const professionalId = requireProfessional(actor);
  const pageSize = Math.min(query.pageSize ?? 20, 50);
  const page = Math.max(query.page ?? 1, 1);
  const where: Prisma.CareRelationshipWhereInput = {
    professionalId,
    status: "ACTIVE",
    ...(query.q
      ? { patient: { user: { OR: [{ name: { contains: query.q, mode: "insensitive" } }, { email: { contains: query.q, mode: "insensitive" } }] } } }
      : {}),
  };
  const [total, rows] = await Promise.all([
    db.careRelationship.count({ where }),
    db.careRelationship.findMany({
      where,
      include: { patient: { include: { user: { select: { name: true, email: true } } } } },
      orderBy: query.sort === "recent" ? { startedAt: "desc" } : { patient: { user: { name: "asc" } } },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
  ]);
  return { total, page, pageSize, rows };
}
