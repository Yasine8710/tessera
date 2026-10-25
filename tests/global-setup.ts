import { execSync } from "node:child_process";
import { config } from "dotenv";

export const TEST_DB_URL =
  process.env.TEST_DATABASE_URL ?? "postgresql://caresync:caresync_dev_only@localhost:5433/caresync_test";

export default function setup() {
  config({ path: ".env" });
  // `migrate deploy` creates the database when it does not exist.
  execSync("npx prisma migrate deploy", {
    stdio: "pipe",
    env: { ...process.env, DATABASE_URL: TEST_DB_URL },
  });
}
