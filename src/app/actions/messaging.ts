"use server";

import { act, type ActionResult } from "@/server/action";
import * as messaging from "@/server/services/messaging";

export type ThreadMessage = { id: string; body: string; senderName: string; createdAt: string; mine: boolean };

export async function getMessagesAction(conversationId: string): Promise<ActionResult<ThreadMessage[]>> {
  return act(async (s) => {
    const rows = await messaging.getMessages(s, conversationId);
    return rows.map((m) => ({ id: m.id, body: m.body, senderName: m.senderName, createdAt: m.createdAt.toISOString(), mine: m.mine }));
  });
}

export async function sendMessageAction(conversationId: string, body: string): Promise<ActionResult> {
  return act(async (s) => {
    await messaging.sendMessage(s, { conversationId, body });
  });
}
