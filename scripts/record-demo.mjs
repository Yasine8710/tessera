// Records a short tour of the real desktop app (splash, demo patient, dark theme, clinician, administrator)
// and converts it to docs/media/tessera-demo.gif for the README.
// Usage: npm run desktop:prepare && node scripts/record-demo.mjs   (needs ffmpeg on PATH or FFMPEG=path)
import { _electron as electron } from "@playwright/test";
import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readdirSync, rmSync, statSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const data = mkdtempSync(path.join(tmpdir(), "tessera-gif-"));
const videos = path.join(data, "video");
const out = path.join(root, "docs", "media", "tessera-demo.gif");
const ffmpeg = process.env.FFMPEG || "ffmpeg";
const pause = (ms) => new Promise((r) => setTimeout(r, ms));

const t0 = Date.now();
const app = await electron.launch({
  args: ["."],
  cwd: root,
  env: { ...process.env, TESSERA_DATA_DIR: data },
  recordVideo: { dir: videos, size: { width: 1280, height: 720 } },
});
const page = await app.firstWindow();
await page.waitForURL(/127\.0\.0\.1:\d+\/(setup|login)/, { timeout: 90_000 });

const tReady = (Date.now() - t0) / 1000; // the engine takes a while to start: keep only the first moments of the splash
async function smoothScroll(y) {
  await page.evaluate((top) => window.scrollTo({ top, behavior: "smooth" }), y);
  await pause(1100);
}
async function demo(label) {
  const b = page.getByRole("button", { name: label });
  await b.scrollIntoViewIfNeeded();
  await pause(700);
  await b.click();
}
async function signOut() {
  await page.getByRole("button", { name: /sign out/i }).first().click();
  await page.waitForURL(/\/(login|setup)$/);
  await pause(1200);
}

await pause(1800); // first-run screen settles
await demo("Demo as patient");
await page.waitForURL(/\/patient$/);
await pause(2600); // overview animations
await smoothScroll(650);
await smoothScroll(0);
const theme = page.getByRole("button", { name: /^Theme:/ }).first();
await theme.click(); await pause(350);
await theme.click(); await pause(1100); // dark
await page.getByRole("link", { name: "Progress" }).first().click();
await pause(2200);
await signOut();

await demo("Demo as medical staff");
await page.waitForURL(/\/staff$/);
await pause(2500);
await page.getByRole("link", { name: "Monitoring" }).first().click();
await pause(1900);
await signOut();

await demo("Demo as administrator");
await page.waitForURL(/\/admin$/);
await pause(2500);
await page.getByRole("link", { name: "Users" }).first().click();
await pause(1500);

await app.close();
const webm = readdirSync(videos).filter((f) => f.endsWith(".webm")).map((f) => path.join(videos, f))[0];
mkdirSync(path.dirname(out), { recursive: true });
execFileSync(ffmpeg, [
  "-y", "-i", webm,
  "-vf", `select='lt(t,2.4)+gte(t,${(tReady - 0.2).toFixed(2)})',setpts=N/FRAME_RATE/TB,fps=9,scale=800:-1:flags=lanczos,split[s0][s1];[s0]palettegen=max_colors=96:stats_mode=diff[p];[s1][p]paletteuse=dither=bayer:bayer_scale=5:diff_mode=rectangle`,
  "-loop", "0", out,
], { stdio: "ignore" });
rmSync(data, { recursive: true, force: true });
console.log(out, (statSync(out).size / 1048576).toFixed(1) + " MB");
