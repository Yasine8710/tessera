import { _electron as electron } from "@playwright/test";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

const dir = mkdtempSync(path.join(tmpdir(), "cs-"));
const app = await electron.launch({ args: ["."], env: { ...process.env, CARESYNC_DATA_DIR: dir } });
const win = await app.firstWindow();
await win.waitForURL(/127\.0\.0\.1:\d+\/setup/, { timeout: 90000 });
console.log("URL", win.url());
console.log("BODY", (await win.locator("body").innerText()).slice(0, 300));
await win.screenshot({ path: path.join(dir, "shot.png") });
console.log("shot", path.join(dir, "shot.png"));
await app.close();
