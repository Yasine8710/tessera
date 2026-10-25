import "dotenv/config";
import { db } from "../src/server/db";
import { audit } from "../src/server/audit";
import { hashPassword } from "../src/server/security";

/**
 * Controlled bootstrap for the first platform administrator. There is no public admin route.
 * Usage: ADMIN_EMAIL=you@example.org ADMIN_PASSWORD='long-passphrase' npm run admin:create
 */
async function main() {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;
  if (!email || !password) throw new Error("Set ADMIN_EMAIL and ADMIN_PASSWORD.");
  if (password.length < 14) throw new Error("ADMIN_PASSWORD must be at least 14 characters.");
  const name = process.env.ADMIN_NAME ?? "Platform Administrator";
  const existing = await db.user.findUnique({ where: { email } });
  if (existing && existing.role !== "ADMIN") throw new Error("That email belongs to a non-admin account.");
  const user = await db.user.upsert({
    where: { email },
    create: { email, name, passwordHash: await hashPassword(password), role: "ADMIN", status: "ACTIVE", emailVerifiedAt: new Date() },
    update: { passwordHash: await hashPassword(password), status: "ACTIVE" },
  });
  await audit(user.id, "admin.bootstrap", "User", user.id);
  console.log(`Administrator ready: ${email}`);
}

main()
  .catch((e) => {
    console.error(e.message);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
