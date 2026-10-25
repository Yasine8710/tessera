import { defineConfig, devices } from "@playwright/test";
import { config } from "dotenv";

config({ path: ".env" });
const port = Number(process.env.E2E_PORT ?? 4317);
const baseURL = `http://localhost:${port}`;

export default defineConfig({
  testDir: "e2e",
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  timeout: 60_000,
  expect: { timeout: 10_000 },
  reporter: process.env.CI ? [["github"], ["html", { open: "never" }]] : "list",
  use: { baseURL, timezoneId: "UTC", locale: "en-GB", trace: "retain-on-failure", screenshot: "only-on-failure" },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"] } },
    { name: "mobile", testMatch: /responsive\.spec\.ts/, use: { ...devices["Pixel 7"] } },
  ],
  webServer: {
    // Requires a prior `npm run build` (CI does this; locally run it once).
    command: `npx next start -p ${port}`,
    url: `${baseURL}/api/health`,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    env: { APP_URL: baseURL, DEMO_MODE: "true" },
  },
});
