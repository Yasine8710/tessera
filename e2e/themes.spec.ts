import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import { createAdmin, disconnect, resetRateLimits, signIn } from "./helpers";

// Both themes must pass the same a11y rules. Screenshots land in results/design for visual review.
test.beforeAll(resetRateLimits);
test.afterAll(disconnect);
test.use({ reducedMotion: "reduce" });

const THEMES = ["light", "dark"] as const;

async function violations(page: Page) {
  const r = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"]).analyze();
  return r.violations.filter((v) => v.impact === "serious" || v.impact === "critical").map((v) => `${v.id}: ${v.nodes[0]?.target.join(" ")}`);
}

async function check(page: Page, theme: string, path: string, name: string) {
  await page.goto(path);
  await expect(page.locator("html"), `${path} theme`).toHaveAttribute("data-theme", theme);
  await page.waitForTimeout(500);
  await page.screenshot({ path: `results/design/${theme}-${name}.png`, fullPage: false });
  expect(await violations(page), `${theme} ${path}`).toEqual([]);
}

for (const theme of THEMES) {
  test.describe(`${theme} theme`, () => {
    // Hydration mismatches (React #418) re-render the page and have wiped the theme attribute before.
    const errors: string[] = [];
    test.beforeEach(async ({ page, isMobile }) => {
      test.skip(isMobile, "desktop only");
      errors.length = 0;
      page.on("pageerror", (e) => errors.push(String(e).slice(0, 200)));
      await page.addInitScript((t) => localStorage.setItem("tessera-theme", t), theme);
    });
    test.afterEach(() => {
      expect(errors, "uncaught page errors").toEqual([]);
    });

    test("public pages", async ({ page }) => {
      for (const [p, n] of [["/", "landing"], ["/login", "login"], ["/register/patient", "register"], ["/privacy", "privacy"], ["/nope", "notfound"]] as const) {
        await check(page, theme, p, n);
      }
    });

    test("patient portal", async ({ page }) => {
      await page.goto("/login");
      await page.getByRole("button", { name: /demo.*patient|patient.*demo/i }).first().click();
      await page.waitForURL("**/patient", { timeout: 30_000 });
      for (const p of ["", "/medications", "/routines", "/journal", "/progress", "/care-team", "/messages", "/settings"]) {
        await check(page, theme, `/patient${p}`, `patient${p.replace("/", "-") || "-home"}`);
      }
    });

    test("staff portal", async ({ page }) => {
      await page.goto("/login");
      await page.getByRole("button", { name: /demo.*staff|staff.*demo/i }).first().click();
      await page.waitForURL("**/staff", { timeout: 30_000 });
      for (const p of ["", "/patients", "/monitoring", "/appointments", "/reports", "/invitations"]) {
        await check(page, theme, `/staff${p}`, `staff${p.replace("/", "-") || "-home"}`);
      }
    });

    test("admin portal", async ({ page }) => {
      const admin = await createAdmin();
      await signIn(page, admin.email);
      await page.waitForURL("**/admin");
      for (const p of ["", "/approvals", "/users", "/organizations", "/audit", "/settings"]) {
        await check(page, theme, `/admin${p}`, `admin${p.replace("/", "-") || "-home"}`);
      }
    });
  });
}

test("theme toggle switches and remembers the choice", async ({ page, isMobile }) => {
  test.skip(isMobile, "desktop only");
  await page.goto("/login");
  const html = page.locator("html");
  const toggle = page.getByRole("button", { name: /^Theme:/ }).first();
  await toggle.click(); // system -> light
  await expect(html).toHaveAttribute("data-theme", "light");
  await toggle.click(); // light -> dark
  await expect(html).toHaveAttribute("data-theme", "dark");
  await page.reload();
  await expect(html).toHaveAttribute("data-theme", "dark");
});
