"use server";

import { act, type ActionResult } from "@/server/action";
import * as care from "@/server/services/care";
import type { ConsentChoice } from "@/server/services/care";

export async function acceptInvitationAction(ref: { token?: string; invitationId?: string }, consents: ConsentChoice): Promise<ActionResult> {
  return act(async (s) => {
    await care.acceptInvitation(s, ref, consents);
  });
}

export async function declineInvitationAction(invitationId: string): Promise<ActionResult> {
  return act((s) => care.declineInvitation(s, invitationId));
}

export async function requestConnectionAction(professionalEmail: string, consents: ConsentChoice): Promise<ActionResult> {
  return act(async (s) => {
    await care.requestConnection(s, professionalEmail, consents);
  });
}

export async function endRelationshipAction(relationshipId: string): Promise<ActionResult> {
  return act((s) => care.endRelationship(s, relationshipId));
}

export async function updateConsentsAction(relationshipId: string, consents: ConsentChoice): Promise<ActionResult> {
  return act((s) => care.updateConsents(s, relationshipId, consents));
}

/** Returns the one-time accept link so the sender can share it when email delivery is not configured. */
export async function createInvitationAction(input: unknown): Promise<ActionResult<{ acceptUrl: string; emailDelivered: boolean }>> {
  return act(async (s) => {
    const r = await care.createInvitation(s, input);
    return { acceptUrl: r.acceptUrl, emailDelivered: r.emailDelivered };
  });
}

export async function revokeInvitationAction(invitationId: string): Promise<ActionResult> {
  return act((s) => care.revokeInvitation(s, invitationId));
}

export async function respondToRequestAction(relationshipId: string, accept: boolean): Promise<ActionResult> {
  return act((s) => care.respondToRequest(s, relationshipId, accept));
}
