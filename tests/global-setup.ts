import { execSync } from "node:child_process";
import { rmSync } from "node:fs";
import path from "node:path";
import { config } from "dotenv";

export const TEST_DB_URL = process.env.TEST_DATABASE_URL ?? `file:${path.resolve("prisma", "test.db").split(path.sep).join("/")}`;

export default function setup() {
  config({ path: ".env" });
  // Fresh unencrypted database per run.
  for (const ext of ["", "-wal", "-shm", "-journal"]) rmSync(TEST_DB_URL.replace(/^file:/, "") + ext, { force: true });
  execSync("npx prisma migrate deploy", {
    stdio: "pipe",
    env: { ...process.env, DATABASE_URL: TEST_DB_URL, TESSERA_DB_KEY: "" },
  });
}
