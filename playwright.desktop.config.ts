import { defineConfig } from "@playwright/test";

// Drives the real Electron app (dev tree, or the packaged exe when CS_EXE is set).
export default defineConfig({
  testDir: "tests/desktop",
  testMatch: /.*\.spec\.ts/,
  fullyParallel: false,
  workers: 1,
  timeout: 180_000,
  expect: { timeout: 15_000 },
  reporter: "list",
  use: { trace: "retain-on-failure" },
});
