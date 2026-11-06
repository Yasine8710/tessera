import { randomUUID } from "node:crypto";
import { afterEach, describe, expect, it } from "vitest";
import { db } from "@/server/db";
import * as admin from "@/server/services/admin";
import * as auth from "@/server/services/auth";
import { DEMO_ACCOUNTS, demoAvailable, ensureDemoData } from "@/server/services/demo";
import { makeAdmin, makePatient } from "./helpers";

async function demoActor(kind: keyof typeof DEMO_ACCOUNTS) {
  await ensureDemoData();
  const s = await auth.login(DEMO_ACCOUNTS[kind], randomUUID());
  const actor = await auth.actorFromSession(s.token);
  if (!actor) throw new Error("no session");
  return actor;
}

describe("demo accounts", () => {
  afterEach(() => {
    delete process.env.TESSERA_DESKTOP;
    delete process.env.DEMO_MODE;
  });

  it("exist for all three roles and sign in as demo actors", async () => {
    const roles = await Promise.all((["patient", "staff", "admin"] as const).map(async (k) => (await demoActor(k)).role));
    expect(roles).toEqual(["PATIENT", "PROFESSIONAL", "ADMIN"]);
    expect((await demoActor("admin")).isDemo).toBe(true);
    // idempotent
    await ensureDemoData();
    expect(await db.user.count({ where: { email: DEMO_ACCOUNTS.admin.email } })).toBe(1);
  });

  it("the demo administrator cannot change anything", async () => {
    const demo = await demoActor("admin");
    const target = await makePatient();
    await expect(admin.setUserStatus(demo, target.userId, "SUSPENDED")).rejects.toThrow(/read-only/);
    await expect(admin.setSetting(demo, "demoEnabled", false)).rejects.toThrow(/read-only/);
    await expect(admin.createOrganization(demo, "Nope")).rejects.toThrow(/read-only/);
    await expect(admin.issueUserResetLink(demo, target.userId)).rejects.toThrow(/read-only/);
    await expect(admin.approveProfessional(demo, target.userId)).rejects.toThrow(/read-only/);
  });

  it("the demo administrator only sees demo data", async () => {
    const demo = await demoActor("admin");
    const real = await makePatient("Real Person");
    const users = await admin.listUsers(demo, { q: real.email });
    expect(users.rows).toHaveLength(0);
    const all = await admin.listUsers(demo);
    expect(all.rows.length).toBeGreaterThan(0);
    expect(all.rows.every((u) => u.isDemo)).toBe(true);
    const audit = await admin.listAudit(demo);
    expect(audit.rows.every((r) => r.actor === null || r.actor.name.includes("(demo)"))).toBe(true);
    expect(await admin.listOrganizations(demo)).toEqual([]);
  });

  it("the sign-in screen offers demos per environment, and a real admin can hide them on desktop", async () => {
    process.env.DEMO_MODE = "true";
    expect(await demoAvailable()).toBe(true);
    process.env.DEMO_MODE = "false";
    expect(await demoAvailable()).toBe(false);

    process.env.TESSERA_DESKTOP = "1";
    const real = await makeAdmin();
    expect(await demoAvailable()).toBe(true);
    await admin.setSetting(real.actor, "demoEnabled", false);
    expect(await demoAvailable()).toBe(false);
    await admin.setSetting(real.actor, "demoEnabled", true);
    expect(await demoAvailable()).toBe(true);
    await expect(admin.setSetting(real.actor, "demoEnabled", "yes" as unknown as boolean)).rejects.toThrow();
  });
});
