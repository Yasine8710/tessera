import { randomUUID } from "node:crypto";
import type { Page } from "@playwright/test";
import { db } from "../src/server/db";
import * as auth from "../src/server/services/auth";
import { hashPassword, hashToken } from "../src/server/security";

export const PASSWORD = "e2e-passphrase-123";
export const uniq = (p: string) => `${p}-${randomUUID().slice(0, 8)}@e2e.invalid`;

/** Creates an admin-approved professional (what an administrator's approval produces). */
export async function createApprovedProfessional(name = "Dr E2E") {
  const email = uniq("pro");
  const { userId } = await auth.registerProfessional(
    { name, email, password: PASSWORD, timezone: "UTC", profession: "GP", licenseNumber: "E2E-0001", licenseRegion: "Testland", acceptTerms: true },
    randomUUID(),
  );
  await db.user.update({ where: { id: userId }, data: { status: "ACTIVE", emailVerifiedAt: new Date() } });
  await db.professionalProfile.update({ where: { userId }, data: { verifiedAt: new Date() } });
  return { email, userId };
}

export async function createAdmin() {
  const email = uniq("admin");
  await db.user.create({ data: { email, name: "Admin E2E", passwordHash: await hashPassword(PASSWORD), role: "ADMIN", status: "ACTIVE", emailVerifiedAt: new Date() } });
  return { email };
}

export async function plantResetToken(email: string) {
  const user = await db.user.findUniqueOrThrow({ where: { email } });
  const token = `e2e-reset-${randomUUID()}`;
  await db.authToken.create({ data: { userId: user.id, purpose: "PASSWORD_RESET", tokenHash: hashToken(token), expiresAt: new Date(Date.now() + 600_000) } });
  return token;
}

export async function signIn(page: Page, email: string, password = PASSWORD) {
  await page.goto("/login");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: /^sign in$/i }).click();
}

export async function signOut(page: Page) {
  await page.getByRole("button", { name: /sign out/i }).first().click();
  await page.waitForURL("**/");
}

/** Repeated local runs share one client IP; clear counters so earlier runs do not trip the limiter. */
export async function resetRateLimits() {
  await db.rateLimit.deleteMany();
}

export async function disconnect() {
  await db.$disconnect();
}
