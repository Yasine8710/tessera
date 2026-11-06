import { config } from "dotenv";

config({ path: ".env" });
import { TEST_DB_URL } from "./global-setup";

process.env.DATABASE_URL = TEST_DB_URL;
delete process.env.CARESYNC_DB_KEY;
process.env.APP_SECRET ??= "test-secret-test-secret-test-secret-00";
(process.env as Record<string, string>).NODE_ENV = "test";
