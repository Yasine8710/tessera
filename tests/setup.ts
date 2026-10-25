import { config } from "dotenv";

config({ path: ".env" });
process.env.DATABASE_URL =
  process.env.TEST_DATABASE_URL ?? "postgresql://caresync:caresync_dev_only@localhost:5433/caresync_test";
process.env.APP_SECRET ??= "test-secret-test-secret-test-secret-00";
(process.env as Record<string, string>).NODE_ENV = "test";
