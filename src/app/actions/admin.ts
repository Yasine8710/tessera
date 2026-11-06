"use server";

import { act, type ActionResult } from "@/server/action";
import * as admin from "@/server/services/admin";

export async function approveProfessionalAction(userId: string): Promise<ActionResult> {
  return act((s) => admin.approveProfessional(s, userId));
}

export async function rejectProfessionalAction(userId: string): Promise<ActionResult> {
  return act((s) => admin.rejectProfessional(s, userId));
}

export async function setUserStatusAction(userId: string, status: "ACTIVE" | "SUSPENDED"): Promise<ActionResult> {
  return act((s) => admin.setUserStatus(s, userId, status));
}

export async function issueResetLinkAction(userId: string): Promise<ActionResult<{ path: string; minutes: number }>> {
  return act((s) => admin.issueUserResetLink(s, userId));
}

export async function createOrganizationAction(name: string): Promise<ActionResult> {
  return act(async (s) => {
    await admin.createOrganization(s, name);
  });
}

export async function addOrgMemberAction(orgId: string, email: string, title?: string): Promise<ActionResult> {
  return act((s) => admin.addOrgMember(s, orgId, email.trim(), title?.trim() || undefined));
}

export async function setStaleDaysAction(days: number): Promise<ActionResult> {
  return act((s) => admin.setSetting(s, "staleDays", days));
}

export async function setSupportEmailAction(email: string): Promise<ActionResult> {
  return act((s) => admin.setSetting(s, "supportEmail", email.trim()));
}
