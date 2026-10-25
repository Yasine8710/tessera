import { expect, test, type Page } from "@playwright/test";
import { PASSWORD, createApprovedProfessional, disconnect, plantResetToken, resetRateLimits, signIn, signOut, uniq } from "./helpers";

test.describe.configure({ mode: "serial" });
test.beforeAll(resetRateLimits);
test.afterAll(disconnect);

const patientEmail = uniq("patient");
const NEW_PASSWORD = "e2e-new-passphrase-456";
let proEmail = "";
let strangerEmail = "";
let inviteLink = "";
let patientProfileUrl = "";

async function newPage(browser: import("@playwright/test").Browser) {
  const ctx = await browser.newContext({ timezoneId: "UTC", locale: "en-GB" });
  return { ctx, page: await ctx.newPage() };
}

test("1. a patient registers and lands in the patient portal", async ({ page }) => {
  await page.goto("/register/patient");
  await page.getByLabel("Full name").fill("Pat E2E");
  await page.getByLabel("Email").fill(patientEmail);
  await page.getByLabel("Password").fill(PASSWORD);
  await page.getByLabel(/accept the terms/i).check();
  await page.getByRole("button", { name: "Create patient account" }).click();
  await page.waitForURL("**/patient");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Pat");
  await signOut(page);
  // ...and can log in again
  await signIn(page, patientEmail);
  await page.waitForURL("**/patient");
});

test("2. a verified professional signs in to the staff portal", async ({ page }) => {
  proEmail = (await createApprovedProfessional("Dr Invite")).email;
  strangerEmail = (await createApprovedProfessional("Dr Stranger")).email;
  await signIn(page, proEmail);
  await page.waitForURL("**/staff");
  await expect(page.getByRole("link", { name: "Patients" }).first()).toBeVisible();
});

test("2b. an unapproved professional cannot reach staff pages", async ({ page }) => {
  const email = uniq("pending");
  await page.goto("/register/professional");
  await page.getByLabel("Full name").fill("Dr Pending");
  await page.getByLabel(/Work email|^Email/).first().fill(email);
  await page.getByLabel("Password").fill(PASSWORD);
  await page.getByLabel("Profession").fill("Nurse");
  await page.getByLabel("Licence number").fill("PEND-1234");
  await page.getByLabel("Issuing region").fill("Testland");
  await page.getByLabel(/accept the terms/i).check();
  await page.getByRole("button", { name: "Submit for verification" }).click();
  await page.waitForURL("**/pending-approval");
  await page.goto("/staff/patients");
  await page.waitForURL("**/pending-approval");
});

test("3. a professional invites the patient", async ({ page }) => {
  await signIn(page, proEmail);
  await page.waitForURL("**/staff");
  await page.goto("/staff/invitations");
  await page.getByLabel("Patient email").fill(patientEmail);
  await page.getByRole("button", { name: "Create invitation" }).click();
  const link = page.getByLabel("One-time invitation link");
  await expect(link).toBeVisible();
  inviteLink = await link.inputValue();
  expect(inviteLink).toContain("/invitations/");
  await expect(page.getByText(/not configured|share this link/i).first()).toBeVisible();
});

test("4. the patient accepts the invitation and chooses what to share", async ({ page }) => {
  await signIn(page, patientEmail);
  await page.waitForURL("**/patient");
  await page.goto(new URL(inviteLink).pathname);
  await page.getByLabel("Medication adherence").check();
  await page.getByRole("button", { name: "Accept and connect" }).click();
  await page.waitForURL("**/patient/care-team");
  await expect(page.getByText("Dr Invite").first()).toBeVisible();
  // single use: the same link no longer works
  await page.goto(new URL(inviteLink).pathname);
  await expect(page.getByText(/no longer valid|invalid|expired|already used/i).first()).toBeVisible();
});

test("5. the professional creates a treatment plan with a medication", async ({ page }) => {
  await signIn(page, proEmail);
  await page.waitForURL("**/staff");
  await page.goto("/staff/patients");
  await page.getByRole("link", { name: /Pat E2E/ }).first().click();
  await page.waitForURL(/\/staff\/patients\/.+/);
  patientProfileUrl = new URL(page.url()).pathname;
  await page.goto(`${patientProfileUrl}?tab=plans`);
  await page.getByLabel("Plan title").fill("Diabetes routine");
  await page.getByLabel("Instructions (visible to the patient)").fill("Take medication as scheduled and log how you feel.");
  await page.getByRole("button", { name: "Create care plan" }).click();
  await expect(page.getByText("Diabetes routine").first()).toBeVisible();

  await page.getByText("Add a medication schedule").click();
  await page.getByLabel("Medication name").fill("Metformin");
  await page.getByLabel("Dose").fill("500 mg");
  await page.getByRole("button", { name: "Remove 08:00" }).click();
  await page.getByLabel("Add a time").fill("00:01");
  await page.getByRole("button", { name: /^add( time)?$/i }).click();
  await page.getByRole("button", { name: "Add medication" }).click();
  await expect(page.getByText("Metformin").first()).toBeVisible();
});

test("6. the patient sees the plan and records a scheduled dose", async ({ page }) => {
  await signIn(page, patientEmail);
  await page.waitForURL("**/patient");
  await page.goto("/patient/care-plan");
  await expect(page.getByText("Diabetes routine").first()).toBeVisible();
  await page.goto("/patient/medications");
  await expect(page.getByText("Metformin").first()).toBeVisible();
  await page.getByRole("button", { name: /Record Metformin as taken/ }).first().click();
  await page.getByRole("dialog").getByRole("button", { name: /^(record|save|confirm)/i }).first().click();
  await expect(page.getByText(/taken/i).first()).toBeVisible();
});

test("7. the professional sees the reported dose", async ({ page }) => {
  await signIn(page, proEmail);
  await page.waitForURL("**/staff");
  await page.goto(`${patientProfileUrl}?tab=adherence`);
  await expect(page.getByText(/reported by patient|patient-reported/i).first()).toBeVisible();
  await expect(page.getByText(/taken/i).first()).toBeVisible();
});

test("8. unauthorized users are denied", async ({ page, browser, request }) => {
  // anonymous
  await page.goto("/patient");
  await page.waitForURL("**/login");
  expect((await request.get("/api/v1/me")).status()).toBe(401);
  expect((await request.get("/api/account/export")).status()).toBe(401);
  expect((await request.post("/api/cron/reminders")).status()).toBe(401);
  // a different, approved professional cannot open the patient
  const { ctx, page: other } = await newPage(browser);
  await signIn(other, strangerEmail);
  await other.waitForURL("**/staff");
  await other.goto(patientProfileUrl);
  // Streaming may already have sent a 200 status; the content must be the not-found page with no patient data.
  await expect(other.getByText(/could not find that page/i).first()).toBeVisible();
  await expect(other.getByText("Pat E2E")).toHaveCount(0);
  await expect(other.getByText("Metformin")).toHaveCount(0);
  await ctx.close();
  // a patient cannot open staff or admin areas
  await signIn(page, patientEmail);
  await page.waitForURL("**/patient");
  await page.goto("/staff");
  await page.waitForURL("**/patient");
  await page.goto("/admin");
  await page.waitForURL("**/patient");
});

test("9. a patient cannot change a clinician-authorized prescription", async ({ page }) => {
  await signIn(page, patientEmail);
  await page.waitForURL("**/patient");
  await page.goto("/patient/medications");
  await expect(page.getByRole("textbox", { name: /^dose$/i })).toHaveCount(0);
  await expect(page.getByRole("button", { name: /stop|edit|delete/i })).toHaveCount(0);
  await page.getByRole("button", { name: /Ask about a change/ }).first().click();
  await page.getByLabel("What would you like to ask about?").fill("Could I take this with breakfast instead?");
  await page.getByRole("dialog").getByRole("button", { name: /send|submit|ask/i }).last().click();
  await expect(page.getByText(/sent|your question|open/i).first()).toBeVisible();
});

test("10. password reset and logout behave correctly", async ({ page }) => {
  await page.goto("/forgot-password");
  await page.getByLabel("Email").fill(patientEmail);
  await page.getByRole("button", { name: /send|reset/i }).click();
  await expect(page.getByText(/if an account|check your|we.ve sent|reset link/i).first()).toBeVisible();

  const token = await plantResetToken(patientEmail);
  await page.goto(`/reset-password?token=${token}`);
  await page.getByLabel("New password").fill(NEW_PASSWORD);
  await page.getByRole("button", { name: /reset|save|set/i }).click();
  await expect(page.getByRole("link", { name: /sign in/i }).first()).toBeVisible();

  // used token is rejected
  await page.goto(`/reset-password?token=${token}`);
  await page.getByLabel("New password").fill("another-passphrase-789");
  await page.getByRole("button", { name: /reset|save|set/i }).click();
  await expect(page.getByText(/invalid or has expired/i).first()).toBeVisible();

  // old password fails, new works
  await signIn(page, patientEmail, PASSWORD);
  await expect(page.getByText(/incorrect email or password/i).first()).toBeVisible();
  await signIn(page, patientEmail, NEW_PASSWORD);
  await page.waitForURL("**/patient");

  // logout ends the session
  await signOut(page);
  await page.goto("/patient");
  await page.waitForURL("**/login");
});

export type { Page };
