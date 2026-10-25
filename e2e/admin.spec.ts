import { expect, test } from "@playwright/test";
import { PASSWORD, createAdmin, disconnect, resetRateLimits, signIn, signOut, uniq } from "./helpers";

test.beforeAll(resetRateLimits);
test.afterAll(disconnect);

test("administrator approves a professional; admins cannot reach clinical pages", async ({ page }) => {
  const proEmail = uniq("newpro");
  const name = `Dr Awaiting ${proEmail.slice(7, 13)}`;
  await page.goto("/register/professional");
  await page.getByLabel("Full name").fill(name);
  await page.getByLabel(/Work email|^Email/).first().fill(proEmail);
  await page.getByLabel("Password").fill(PASSWORD);
  await page.getByLabel("Profession").fill("Physiotherapist");
  await page.getByLabel("Licence number").fill("PHY-4321");
  await page.getByLabel("Issuing region").fill("Testland");
  await page.getByLabel(/accept the terms/i).check();
  await page.getByRole("button", { name: "Submit for verification" }).click();
  await page.waitForURL("**/pending-approval");
  await signOut(page);

  const admin = await createAdmin();
  await signIn(page, admin.email);
  await page.waitForURL("**/admin");
  await page.goto("/admin/approvals");
  const row = page.getByText(name).first();
  await expect(row).toBeVisible();
  const item = page.getByRole("listitem").filter({ hasText: name });
  await item.getByRole("button", { name: /^approve/i }).first().click();
  const dialog = page.getByRole("dialog");
  if (await dialog.isVisible().catch(() => false)) await dialog.getByRole("button", { name: /approve|confirm/i }).last().click();
  await expect(page.getByText(name)).toHaveCount(0);

  // admin has no route into clinical areas
  await page.goto("/staff");
  await page.waitForURL("**/admin");
  await page.goto("/patient");
  await page.waitForURL("**/admin");
  await signOut(page);

  // the approved professional now reaches the staff portal
  await signIn(page, proEmail);
  await page.waitForURL("**/staff");
});
