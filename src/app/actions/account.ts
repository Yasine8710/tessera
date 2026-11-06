"use server";

import { redirect } from "next/navigation";
import { act, type ActionResult } from "@/server/action";
import { clearSessionCookie } from "@/server/session";
import * as account from "@/server/services/account";
import * as notifications from "@/server/services/notifications";

type PrefKey = "doseReminders" | "missedAlerts" | "routineReminders" | "appointmentAlerts" | "messageAlerts";

export async function markNotificationReadAction(id?: string): Promise<ActionResult> {
  return act((s) => notifications.markRead(s, id));
}

export async function updatePreferencesAction(input: Partial<Record<PrefKey, boolean>> & { timezone?: string }): Promise<ActionResult> {
  return act((s) => {
    const { timezone, ...rest } = input;
    const prefs: Partial<Record<PrefKey, boolean>> = {};
    for (const k of ["doseReminders", "missedAlerts", "routineReminders", "appointmentAlerts", "messageAlerts"] as const) {
      if (typeof rest[k] === "boolean") prefs[k] = rest[k];
    }
    return notifications.updatePreferences(s, { ...prefs, ...(typeof timezone === "string" ? { timezone } : {}) });
  });
}

export async function deleteAccountAction(password: string): Promise<ActionResult> {
  const r = await act((s) => account.deleteMyAccount(s, String(password ?? "")));
  if (!r.ok) return r;
  await clearSessionCookie();
  redirect("/");
}

export async function unreadSinceAction(sinceIso: string): Promise<ActionResult<number>> {
  return act((s) => notifications.unreadSince(s, new Date(sinceIso)));
}
