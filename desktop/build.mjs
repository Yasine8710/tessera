// Builds the Next.js standalone server that the Electron shell runs, and makes sure its native parts are present.
import { execSync } from "node:child_process";
import { cpSync, existsSync, readdirSync, rmSync } from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const run = (cmd, env = {}) => execSync(cmd, { cwd: root, stdio: "inherit", env: { ...process.env, ...env } });

rmSync(path.join(root, ".next"), { recursive: true, force: true });
run("npx prisma generate");
run("npx next build", { TESSERA_DESKTOP_BUILD: "1", NODE_ENV: "production" });

const out = path.join(root, ".next", "standalone");
if (!existsSync(path.join(out, "server.js"))) throw new Error("standalone/server.js missing (check outputFileTracingRoot)");
cpSync(path.join(root, ".next", "static"), path.join(out, ".next", "static"), { recursive: true });
cpSync(path.join(root, "public"), path.join(out, "public"), { recursive: true });

// Native / generated packages the tracer can miss: copy them whole.
const need = ["better-sqlite3", "@prisma/client", ".prisma", "@prisma/adapter-better-sqlite3", "@prisma/driver-adapter-utils", "@prisma/debug"];
for (const pkg of need) {
  const from = path.join(root, "node_modules", pkg);
  if (!existsSync(from)) continue;
  cpSync(from, path.join(out, "node_modules", pkg), { recursive: true, force: true });
}
// Prisma query engine must be for Windows only; drop other platforms' engines to keep the installer small.
const engDir = path.join(out, "node_modules", ".prisma", "client");
for (const f of readdirSync(engDir)) if (/query_engine|libquery/.test(f) && !/windows/.test(f)) rmSync(path.join(engDir, f), { force: true });
for (const f of ["prebuilds"]) {
  const d = path.join(out, "node_modules", "better-sqlite3", f);
  for (const n of readdirSync(d)) if (n !== "win32-x64.node") rmSync(path.join(d, n), { force: true });
}
// Not needed at runtime (image optimisation is off, TypeScript is a build tool).
for (const pkg of ["typescript", "sharp", "@img"]) rmSync(path.join(out, "node_modules", pkg), { recursive: true, force: true });
for (const junk of [".env", "prisma/dev.db", "prisma/test.db"]) rmSync(path.join(out, junk), { force: true });
console.log("standalone ready:", out);
