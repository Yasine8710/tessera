import { _electron as electron, expect, test, type ElectronApplication, type Page } from "@playwright/test";
import { existsSync, mkdtempSync, readFileSync, statSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

const ADMIN = { name: "Ada Admin", email: "ada@desk.invalid", password: "desktop-admin-passphrase" };
const PW = "patient-passphrase-123";
const NEW_PW = "brand-new-passphrase-9";
const dataDir = mkdtempSync(path.join(tmpdir(), "cs-e2e-"));
const exe = process.env.CS_EXE;
// "**/patient" would also match /register/patient, so anchor on the portal home.
const PATIENT_HOME = /127\.0\.0\.1:\d+\/patient$/;

let app: ElectronApplication;
let page: Page;

async function launch() {
  app = await electron.launch({ ...(exe ? { executablePath: exe } : { args: ["."] }), env: { ...process.env, TESSERA_DATA_DIR: dataDir } });
  page = await app.firstWindow();
  await page.waitForURL(/127\.0\.0\.1:\d+\/(setup|login)/, { timeout: 90_000 });
}

const origin = () => new URL(page.url()).origin;

async function signOut() {
  await page.getByRole("button", { name: /sign out/i }).first().click();
  await page.waitForURL("**/login");
}

async function signIn(email: string, password: string) {
  await page.goto(origin() + "/login");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: /^sign in$/i }).click();
}

async function registerPatient(name: string, email: string) {
  await page.goto(origin() + "/register/patient");
  await page.getByLabel("Full name").fill(name);
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(PW);
  await page.getByLabel(/accept the terms/i).check();
  await page.getByRole("button", { name: "Create patient account" }).click();
  await page.waitForURL(PATIENT_HOME);
}

/** Runs a menu item by label inside the main process. */
async function clickMenu(label: string) {
  await app.evaluate(({ Menu }, l) => {
    const find = (items: Electron.MenuItem[]): Electron.MenuItem | undefined => {
      for (const i of items) {
        if (i.label === l) return i;
        const sub = i.submenu ? find(i.submenu.items) : undefined;
        if (sub) return sub;
      }
    };
    find(Menu.getApplicationMenu()!.items)?.click();
  }, label);
}

test.describe.configure({ mode: "serial" });
test.afterAll(async () => {
  await app?.close().catch(() => {});
});

test("first run asks for an administrator and validates input", async () => {
  await launch();
  expect(page.url()).toMatch(/\/setup$/);
  await page.getByLabel("Your name").fill(ADMIN.name);
  await page.getByLabel("Email").fill(ADMIN.email);
  await page.getByLabel("Password", { exact: true }).fill("short");
  await page.getByLabel("Repeat password").fill("short");
  await page.getByRole("button", { name: "Create administrator" }).click();
  await expect(page.getByRole("alert").first()).toContainText(/14 characters/);
  await page.getByLabel("Password", { exact: true }).fill(ADMIN.password);
  await page.getByLabel("Repeat password").fill("different-passphrase-1");
  await page.getByRole("button", { name: "Create administrator" }).click();
  await expect(page.getByRole("alert").first()).toContainText(/do not match/);
  await page.getByLabel("Repeat password").fill(ADMIN.password);
  await page.getByRole("button", { name: "Create administrator" }).click();
  await page.waitForURL("**/admin");
});

test("setup cannot run twice and the landing page goes to sign-in", async () => {
  await signOut();
  await page.goto(origin() + "/setup");
  await page.waitForURL("**/login");
  await page.goto(origin() + "/");
  await page.waitForURL("**/login");
  await page.goto(origin() + "/forgot-password");
  await expect(page.getByText(/ask your administrator/i)).toBeVisible();
});

test("database file is encrypted at rest and the local server rejects foreign callers", async () => {
  const file = path.join(dataDir, "tessera.db");
  expect(existsSync(file)).toBe(true);
  expect(statSync(file).size).toBeGreaterThan(4096);
  expect(readFileSync(file).subarray(0, 15).toString()).not.toBe("SQLite format 3");
  const res = await fetch(origin() + "/login"); // no launch token
  expect(res.status).toBe(403);
});

test("renderer is isolated: only the small app bridge is exposed", async () => {
  const seen = await page.evaluate(() => ({
    bridge: Object.keys((window as unknown as { tesseraDesktop: object }).tesseraDesktop).sort(),
    nodeRequire: typeof (window as unknown as { require?: unknown }).require,
    nodeProcess: typeof (window as unknown as { process?: unknown }).process,
  }));
  expect(seen).toEqual({ bridge: ["notify", "onLock", "setTheme", "showMenu"], nodeRequire: "undefined", nodeProcess: "undefined" });
});

test("patient registers without email verification", async () => {
  await registerPatient("Pat Desk", "pat@desk.invalid");
  await page.goto(origin() + "/patient/settings");
  await expect(page.getByText("Email verified")).toBeVisible();
  await signOut();
});

test("professional registers, admin approves, staff portal opens", async () => {
  await page.goto(origin() + "/register/professional");
  await page.getByLabel("Full name").fill("Dr Desk");
  await page.getByLabel(/Work email|^Email/).first().fill("dr@desk.invalid");
  await page.getByLabel("Password").fill(PW);
  await page.getByLabel("Profession").fill("GP");
  await page.getByLabel("Licence number").fill("DESK-1234");
  await page.getByLabel("Issuing region").fill("Testland");
  await page.getByLabel(/accept the terms/i).check();
  await page.getByRole("button", { name: "Submit for verification" }).click();
  await page.waitForURL("**/pending-approval");
  await signOut();

  await signIn(ADMIN.email, ADMIN.password);
  await page.waitForURL("**/admin");
  await page.goto(origin() + "/admin/approvals");
  const item = page.getByRole("listitem").filter({ hasText: "Dr Desk" });
  await item.getByRole("button", { name: /^approve/i }).first().click();
  const dlg = page.getByRole("dialog");
  if (await dlg.isVisible().catch(() => false)) await dlg.getByRole("button", { name: /approve|confirm/i }).last().click();
  await expect(page.getByText("Dr Desk")).toHaveCount(0);
  await signOut();

  await signIn("dr@desk.invalid", PW);
  await page.waitForURL("**/staff");
  await signOut();
});

test("admin issues a one-time reset link that works once", async () => {
  await signIn(ADMIN.email, ADMIN.password);
  await page.waitForURL("**/admin");
  await page.goto(origin() + "/admin/users");
  const row = page.getByRole("row").filter({ hasText: "pat@desk.invalid" });
  await row.getByRole("button", { name: /Reset password/ }).click();
  const link = await row.locator("code").innerText();
  await signOut();

  await page.goto(link);
  await page.getByLabel("New password").first().fill(NEW_PW);
  await page.getByRole("button", { name: /reset|save|set/i }).first().click();
  await signIn("pat@desk.invalid", NEW_PW);
  await page.waitForURL(PATIENT_HOME);
  await signOut();

  await page.goto(link);
  await page.getByLabel("New password").first().fill("another-passphrase-77");
  await page.getByRole("button", { name: /reset|save|set/i }).first().click();
  await expect(page.getByText(/invalid or has expired/i).first()).toBeVisible();
});

test("demo accounts exist for all three roles; the demo administrator is read-only", async () => {
  const demos = [
    ["Demo as patient", /127\.0\.0\.1:\d+\/patient$/],
    ["Demo as medical staff", /127\.0\.0\.1:\d+\/staff$/],
    ["Demo as administrator", /127\.0\.0\.1:\d+\/admin$/],
  ] as const;
  for (const [label, home] of demos) {
    await page.goto(origin() + "/login");
    await page.getByRole("button", { name: label }).click();
    await page.waitForURL(home);
    if (label.endsWith("administrator")) {
      await page.goto(origin() + "/admin/users");
      await expect(page.getByText("demo.patient@tessera.invalid")).toBeVisible();
      await expect(page.getByText("pat@desk.invalid")).toHaveCount(0); // real accounts stay hidden
      await expect(page.getByRole("button", { name: /Suspend|Reset password/ })).toHaveCount(0);
    }
    await signOut();
  }
});

test("a real administrator can hide and show the demo accounts", async () => {
  await signIn(ADMIN.email, ADMIN.password);
  await page.waitForURL("**/admin");
  await page.goto(origin() + "/admin/settings");
  await page.getByRole("button", { name: "Hide demo accounts" }).click();
  await expect(page.getByRole("button", { name: "Show demo accounts" })).toBeVisible();
  await signOut();
  await expect(page.getByRole("button", { name: "Demo as patient" })).toHaveCount(0);
  await signIn(ADMIN.email, ADMIN.password);
  await page.waitForURL("**/admin");
  await page.goto(origin() + "/admin/settings");
  await page.getByRole("button", { name: "Show demo accounts" }).click();
  await expect(page.getByRole("button", { name: "Hide demo accounts" })).toBeVisible();
  await signOut();
  await expect(page.getByRole("button", { name: "Demo as administrator" })).toBeVisible();
});

test("backup, change data, restore brings the backup back", async () => {
  const backup = path.join(dataDir, "manual-backup.db");
  await app.evaluate(({ dialog }, f) => {
    const d = dialog as unknown as Record<string, unknown>;
    d.showSaveDialog = async () => ({ canceled: false, filePath: f });
    d.showMessageBox = async () => ({ response: 1 });
  }, backup);
  await clickMenu("Back up data...");
  await expect.poll(() => existsSync(backup), { timeout: 20_000 }).toBe(true);
  expect(readFileSync(backup).subarray(0, 15).toString()).not.toBe("SQLite format 3");

  await signOut().catch(() => {});
  await registerPatient("Late Patient", "late@desk.invalid");
  await signOut();

  await app.evaluate(({ dialog }, f) => {
    (dialog as unknown as Record<string, unknown>).showOpenDialog = async () => ({ canceled: false, filePaths: [f] });
  }, backup);
  const before = origin();
  await clickMenu("Restore from backup...");
  // The engine restarts on a new port; wait for the new sign-in page.
  await expect.poll(() => (page.url().startsWith(before) ? "" : page.url()), { timeout: 60_000 }).toMatch(/^http:\/\/127\.0\.0\.1:\d+\/login$/);
  expect(origin()).not.toBe(before);

  await signIn("late@desk.invalid", PW);
  await expect(page.getByRole("alert").first()).toBeVisible();
  await signIn("pat@desk.invalid", NEW_PW);
  await page.waitForURL(PATIENT_HOME);
  await signOut();
});

test("kiosk window: opens maximised with the page-drawn title bar and no Windows menu bar", async () => {
  await signIn(ADMIN.email, ADMIN.password);
  await page.waitForURL("**/admin");
  const win = await app.evaluate(({ BrowserWindow }) => {
    const w = BrowserWindow.getAllWindows()[0];
    return { maximized: w.isMaximized(), menuBar: w.isMenuBarVisible(), title: w.getTitle() };
  });
  expect({ maximized: win.maximized, menuBar: win.menuBar }).toEqual({ maximized: true, menuBar: false });
  expect(win.title).toContain("Tessera");
  await expect(page.locator(".desktop-titlebar")).toBeVisible();
  await expect(page.getByRole("button", { name: "Application menu" })).toBeVisible();
  await expect(page.locator("html")).toHaveAttribute("data-desktop", "");
  await page.screenshot({ path: "results/design/desktop-kiosk-admin.png" });
  await signOut();
});

test("data and sign-in survive a restart (key is kept in Windows secure storage)", async () => {
  await app.close();
  await launch();
  expect(page.url()).toMatch(/\/login$/);
  await signIn(ADMIN.email, ADMIN.password);
  await page.waitForURL("**/admin");
});
