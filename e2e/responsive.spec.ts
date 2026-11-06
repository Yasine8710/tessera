import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { resetRateLimits } from "./helpers";

// Runs on desktop (a11y) and a Pixel 7 viewport (no horizontal scroll). Uses the synthetic demo accounts.
test.beforeAll(resetRateLimits);
// Axe samples colours mid-transition otherwise; the reduced-motion path renders the final state.
test.use({ reducedMotion: "reduce" });

const PUBLIC = ["/", "/login", "/register", "/register/patient", "/privacy", "/accessibility"];

async function noHorizontalScroll(page: import("@playwright/test").Page) {
  const where = page.url();
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  const wide = overflow > 1 ? await page.evaluate(() => {
    const w = document.documentElement.clientWidth;
    return [...document.querySelectorAll("body *")].filter((el) => el.getBoundingClientRect().right > w + 1 && ![...el.children].some((c) => c.getBoundingClientRect().right > w + 1)).slice(0, 5).map((el) => `${el.tagName}.${String(el.className).slice(0, 80)}`);
  }) : [];
  expect(overflow, `page scrolls horizontally: ${where} ${wide.join(" | ")}`).toBeLessThanOrEqual(1);
}

async function seriousViolations(page: import("@playwright/test").Page) {
  const r = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"]).analyze();
  return r.violations.filter((v) => v.impact === "serious" || v.impact === "critical").map((v) => `${v.id}: ${v.nodes[0]?.target.join(" ")}`);
}

for (const path of PUBLIC) {
  test(`public ${path}: fits viewport and has no serious a11y violations`, async ({ page }) => {
    await page.goto(path);
    await noHorizontalScroll(page);
    expect(await seriousViolations(page)).toEqual([]);
  });
}

test("landing mobile menu opens and links work", async ({ page, isMobile }) => {
  test.skip(!isMobile, "mobile only");
  await page.goto("/");
  await page.getByRole("button", { name: /menu/i }).click();
  await page.getByRole("link", { name: "FAQ" }).first().click();
  await expect(page).toHaveURL(/#faq/);
});

for (const [kind, label, home] of [
  ["patient", "patient", "/patient"],
  ["staff", "clinician", "/staff"],
] as const) {
  test(`demo ${label} portal pages fit viewport and pass a11y`, async ({ page }) => {
    await page.goto("/login");
    await page.getByRole("button", { name: new RegExp(`demo.*${kind}|${kind}.*demo`, "i") }).first().click();
    await page.waitForURL(`**${home}`, { timeout: 30_000 });
    const pages =
      kind === "patient"
        ? ["", "/medications", "/routines", "/appointments", "/journal", "/progress", "/care-plan", "/care-team", "/messages", "/notifications", "/settings"]
        : ["", "/patients", "/monitoring", "/appointments", "/messages", "/reports", "/invitations", "/notifications", "/settings"];
    for (const p of pages) {
      await page.goto(`${home}${p}`);
      await expect(page.locator("main h1").first()).toBeVisible();
      await noHorizontalScroll(page);
      const v = await seriousViolations(page);
      expect(v, `${home}${p}`).toEqual([]);
    }
  });
}
