import { dedupeKey } from "@/domain/rules";
import { messageSchema } from "@/lib/schemas";
import type { Actor } from "../access";
import { audit } from "../audit";
import { db } from "../db";
import { forbidden, notFound } from "../errors";
import { notify } from "./notifications";

async function myConversation(actor: Actor, conversationId: string) {
  const c = await db.conversation.findFirst({
    where: { id: conversationId, participants: { some: { userId: actor.userId } } },
    include: {
      patient: { include: { user: { select: { name: true } } } },
      professional: { include: { user: { select: { name: true } } } },
    },
  });
  if (!c) throw notFound();
  return c;
}

/** Messaging requires an ACTIVE care relationship at send time (history stays readable after it ends). */
async function relationshipActive(patientId: string, professionalId: string) {
  const r = await db.careRelationship.findUnique({ where: { patientId_professionalId: { patientId, professionalId } } });
  return r?.status === "ACTIVE";
}

export async function listConversations(actor: Actor) {
  const convos = await db.conversation.findMany({
    where: { participants: { some: { userId: actor.userId } } },
    include: {
      patient: { include: { user: { select: { name: true } } } },
      professional: { include: { user: { select: { name: true } } } },
      participants: { where: { userId: actor.userId } },
      messages: { orderBy: { createdAt: "desc" }, take: 1 },
    },
  });
  const out = await Promise.all(
    convos.map(async (c) => {
      const lastRead = c.participants[0]?.lastReadAt ?? new Date(0);
      const unread = await db.message.count({
        where: { conversationId: c.id, senderId: { not: actor.userId }, createdAt: { gt: lastRead } },
      });
      return {
        id: c.id,
        withName: actor.role === "PATIENT" ? c.professional.user.name : c.patient.user.name,
        lastMessageAt: c.messages[0]?.createdAt ?? c.createdAt,
        preview: c.messages[0] ? (c.messages[0].senderId === actor.userId ? "You: " : "") + c.messages[0].body.slice(0, 80) : "No messages yet",
        unread,
      };
    }),
  );
  return out.sort((a, b) => b.lastMessageAt.getTime() - a.lastMessageAt.getTime());
}

export async function getMessages(actor: Actor, conversationId: string, opts: { before?: string; take?: number } = {}) {
  await myConversation(actor, conversationId);
  const take = Math.min(opts.take ?? 50, 100);
  const rows = await db.message.findMany({
    where: { conversationId, ...(opts.before ? { createdAt: { lt: new Date(opts.before) } } : {}) },
    orderBy: { createdAt: "desc" },
    take,
    include: { sender: { select: { name: true } } },
  });
  await db.conversationParticipant.updateMany({
    where: { conversationId, userId: actor.userId },
    data: { lastReadAt: new Date() },
  });
  return rows.reverse().map((m) => ({ id: m.id, body: m.body, senderId: m.senderId, senderName: m.sender.name, createdAt: m.createdAt, mine: m.senderId === actor.userId }));
}

export async function sendMessage(actor: Actor, raw: unknown) {
  const i = messageSchema.parse(raw);
  const c = await myConversation(actor, i.conversationId);
  if (!(await relationshipActive(c.patientId, c.professionalId))) throw forbidden("This care connection is no longer active.");
  const m = await db.message.create({ data: { conversationId: c.id, senderId: actor.userId, body: i.body } });
  await db.conversationParticipant.updateMany({ where: { conversationId: c.id, userId: actor.userId }, data: { lastReadAt: new Date() } });
  // Audit records the event only, never the body.
  await audit(actor.userId, "message.send", "Conversation", c.id);
  const recipient = actor.role === "PATIENT" ? c.professional.userId : c.patient.userId;
  const sender = actor.role === "PATIENT" ? c.patient.user.name : c.professional.user.name;
  await notify(recipient, "MESSAGE", {
    title: `New message from ${sender}`,
    body: "Open CareSync to read it.", // never put message content in notifications
    link: actor.role === "PATIENT" ? "/staff/messages" : "/patient/messages",
    key: dedupeKey("MSG", m.id),
  });
  return m;
}

export async function unreadMessageCount(actor: Actor) {
  const list = await listConversations(actor);
  return list.reduce((n, c) => n + c.unread, 0);
}
