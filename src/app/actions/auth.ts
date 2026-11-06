"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { AppError } from "@/server/errors";
import { actPublic, type ActionResult } from "@/server/action";
import { clearSessionCookie, clientIp, homeFor, readSessionToken, setSessionCookie } from "@/server/session";
import * as auth from "@/server/services/auth";
import { DEMO_ACCOUNTS, demoAvailable, ensureDemoData } from "@/server/services/demo";

export async function registerPatientAction(input: unknown): Promise<ActionResult> {
  return actPublic(async () => {
    await auth.registerPatient(input, await clientIp());
    const s = await auth.login({ email: (input as { email: string }).email, password: (input as { password: string }).password }, await clientIp());
    await setSessionCookie(s.token, s.expiresAt);
    redirect("/patient");
  });
}

/** Staff accounts start as PENDING_APPROVAL; they sign in but get no staff access until an admin approves. */
export async function registerProfessionalAction(input: unknown): Promise<ActionResult> {
  return actPublic(async () => {
    await auth.registerProfessional(input, await clientIp());
    const s = await auth.login({ email: (input as { email: string }).email, password: (input as { password: string }).password }, await clientIp());
    await setSessionCookie(s.token, s.expiresAt);
    redirect("/pending-approval");
  });
}

export async function loginAction(input: unknown): Promise<ActionResult> {
  return actPublic(async () => {
    const ua = (await headers()).get("user-agent") ?? undefined;
    const s = await auth.login(input, await clientIp(), ua);
    await setSessionCookie(s.token, s.expiresAt);
    redirect(homeFor(s.role));
  });
}

export async function logoutAction() {
  const token = await readSessionToken();
  if (token) await auth.logout(token);
  await clearSessionCookie();
  redirect("/");
}

export async function forgotPasswordAction(input: unknown): Promise<ActionResult> {
  return actPublic(async () => {
    await auth.requestPasswordReset(input, await clientIp());
  });
}

export async function resetPasswordAction(input: unknown): Promise<ActionResult> {
  return actPublic(async () => {
    await auth.resetPassword(input);
  });
}

export async function verifyEmailAction(token: string): Promise<ActionResult> {
  return actPublic(async () => {
    await auth.verifyEmail(token);
  });
}

/** Demo mode: synthetic accounts only, and only when DEMO_MODE=true. */
export async function demoLoginAction(kind: "patient" | "staff" | "admin"): Promise<ActionResult> {
  return actPublic(async () => {
    if (!(await demoAvailable())) throw new AppError("FORBIDDEN", "Demo mode is disabled.");
    await ensureDemoData();
    const acct = DEMO_ACCOUNTS[kind];
    const s = await auth.login({ email: acct.email, password: acct.password }, await clientIp());
    await setSessionCookie(s.token, s.expiresAt);
    redirect(homeFor(s.role));
  });
}

/** First run of the desktop app: creates the administrator, then signs them in. */
export async function setupAdminAction(input: { name: string; email: string; password: string }): Promise<ActionResult> {
  return actPublic(async () => {
    if (process.env.TESSERA_DESKTOP !== "1") throw new AppError("FORBIDDEN", "Setup is only available in the desktop app.");
    await auth.setupFirstAdmin(input);
    const s = await auth.login({ email: input.email, password: input.password }, await clientIp());
    await setSessionCookie(s.token, s.expiresAt);
    redirect("/admin");
  });
}
