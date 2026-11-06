import { Prisma } from "@prisma/client";
import { isValidTimeZone } from "@/domain/schedule";
import {
  loginSchema,
  registerPatientSchema,
  registerProfessionalSchema,
  resetPasswordSchema,
  resetRequestSchema,
} from "@/lib/schemas";
import type { Actor } from "../access";
import { audit } from "../audit";
import { db } from "../db";
import { AppError, conflict, invalid, notFound } from "../errors";
import { appUrl, sendMail } from "../mail";
import { isDesktop } from "../desktop";
import { hashPassword, hashToken, newToken, rateLimit, verifyPassword } from "../security";

const SESSION_DAYS = 14;
const VERIFY_HOURS = 48;
const RESET_MINUTES = 60;

function parse<T>(schema: { safeParse: (v: unknown) => { success: boolean; data?: T; error?: { issues: { message: string }[] } } }, v: unknown): T {
  const r = schema.safeParse(v);
  if (!r.success) throw invalid(r.error?.issues[0]?.message ?? "Invalid input.");
  return r.data as T;
}

async function issueToken(userId: string, purpose: "EMAIL_VERIFY" | "PASSWORD_RESET", ttlMs: number) {
  const token = newToken();
  await db.authToken.create({
    data: { userId, purpose, tokenHash: hashToken(token), expiresAt: new Date(Date.now() + ttlMs) },
  });
  return token;
}

async function sendVerification(user: { id: string; email: string }) {
  if (isDesktop()) {
    // No mail server on a single PC: the account is local, so there is nothing to verify.
    await db.user.update({ where: { id: user.id }, data: { emailVerifiedAt: new Date() } });
    return;
  }
  const token = await issueToken(user.id, "EMAIL_VERIFY", VERIFY_HOURS * 3600_000);
  await sendMail(
    user.email,
    "Verify your Tessera email",
    `Open this link to verify your email (valid ${VERIFY_HOURS}h):\n${appUrl(`/verify-email?token=${token}`)}`,
  );
}

function tz(input: string) {
  return isValidTimeZone(input) ? input : "UTC";
}

export async function registerPatient(raw: unknown, ip = "unknown") {
  if (!(await rateLimit(`register:${ip}`, 10, 3600))) throw new AppError("RATE_LIMITED", "Too many attempts. Try later.");
  const i = parse(registerPatientSchema, raw) as ReturnType<typeof registerPatientSchema.parse>;
  try {
    const user = await db.$transaction(async (tx) => {
      const u = await tx.user.create({
        data: {
          email: i.email,
          name: i.name,
          passwordHash: await hashPassword(i.password),
          role: "PATIENT",
          status: "ACTIVE",
          timezone: tz(i.timezone),
          patientProfile: { create: { dateOfBirth: i.dateOfBirth ? new Date(i.dateOfBirth) : null } },
          notificationPref: { create: {} },
        },
      });
      await audit(u.id, "auth.register", "User", u.id, { role: "PATIENT" }, tx);
      return u;
    });
    await sendVerification(user);
    return { userId: user.id };
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002")
      throw conflict("An account with this email already exists.");
    throw e;
  }
}

export async function registerProfessional(raw: unknown, ip = "unknown") {
  if (!(await rateLimit(`register:${ip}`, 10, 3600))) throw new AppError("RATE_LIMITED", "Too many attempts. Try later.");
  const i = parse(registerProfessionalSchema, raw) as ReturnType<typeof registerProfessionalSchema.parse>;
  try {
    const user = await db.$transaction(async (tx) => {
      const u = await tx.user.create({
        data: {
          email: i.email,
          name: i.name,
          passwordHash: await hashPassword(i.password),
          role: "PROFESSIONAL",
          status: "PENDING_APPROVAL", // never self-granted
          timezone: tz(i.timezone),
          professionalProfile: {
            create: {
              profession: i.profession,
              licenseNumber: i.licenseNumber,
              licenseRegion: i.licenseRegion,
              specialty: i.specialty || null,
            },
          },
          notificationPref: { create: {} },
        },
      });
      await audit(u.id, "auth.register", "User", u.id, { role: "PROFESSIONAL" }, tx);
      return u;
    });
    await sendVerification(user);
    return { userId: user.id };
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002")
      throw conflict("An account with this email already exists.");
    throw e;
  }
}

/** Constant-ish response: wrong email and wrong password are indistinguishable. */
export async function login(raw: unknown, ip = "unknown", userAgent?: string) {
  const i = parse(loginSchema, raw) as ReturnType<typeof loginSchema.parse>;
  const ok =
    (await rateLimit(`login:ip:${ip}`, 30, 900)) && (await rateLimit(`login:email:${i.email}`, 8, 900));
  if (!ok) throw new AppError("RATE_LIMITED", "Too many sign-in attempts. Try again in 15 minutes.");

  const user = await db.user.findUnique({ where: { email: i.email } });
  const valid = user
    ? await verifyPassword(i.password, user.passwordHash)
    : (await verifyPassword(i.password, "scrypt$AAAAAAAAAAAAAAAAAAAAAA==$AAAA"), false);
  if (!user || !valid || user.deletedAt) {
    await audit(user?.id ?? null, "auth.login_failed", "User", user?.id);
    throw new AppError("UNAUTHENTICATED", "Incorrect email or password.");
  }
  if (user.status === "SUSPENDED") throw new AppError("FORBIDDEN", "This account is suspended. Contact an administrator.");

  const token = newToken();
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 86400_000);
  await db.session.create({ data: { userId: user.id, tokenHash: hashToken(token), expiresAt, userAgent: userAgent?.slice(0, 200) } });
  await audit(user.id, "auth.login", "User", user.id);
  return { token, expiresAt, role: user.role };
}

export async function logout(token: string) {
  await db.session.deleteMany({ where: { tokenHash: hashToken(token) } });
}

export async function actorFromSession(token: string): Promise<(Actor & { name: string; email: string; status: string; emailVerified: boolean }) | null> {
  const s = await db.session.findUnique({
    where: { tokenHash: hashToken(token) },
    include: { user: { include: { patientProfile: true, professionalProfile: true } } },
  });
  if (!s || s.expiresAt < new Date() || s.user.deletedAt || s.user.status === "SUSPENDED") return null;
  const u = s.user;
  const verifiedPro = u.role === "PROFESSIONAL" && u.status === "ACTIVE" && !!u.professionalProfile?.verifiedAt;
  return {
    userId: u.id,
    role: u.role,
    timezone: u.timezone,
    name: u.name,
    email: u.email,
    status: u.status,
    emailVerified: !!u.emailVerifiedAt,
    patientId: u.patientProfile?.id,
    professionalId: verifiedPro ? u.professionalProfile!.id : undefined,
  };
}

export async function verifyEmail(token: string) {
  const row = await db.authToken.findUnique({ where: { tokenHash: hashToken(token) } });
  if (!row || row.purpose !== "EMAIL_VERIFY" || row.usedAt || row.expiresAt < new Date())
    throw invalid("This verification link is invalid or has expired.");
  await db.$transaction([
    db.authToken.update({ where: { id: row.id }, data: { usedAt: new Date() } }),
    db.user.update({ where: { id: row.userId }, data: { emailVerifiedAt: new Date() } }),
  ]);
  await audit(row.userId, "auth.email_verified", "User", row.userId);
}

/** Always resolves the same way so account existence is not revealed. */
export async function requestPasswordReset(raw: unknown, ip = "unknown") {
  const i = parse(resetRequestSchema, raw) as ReturnType<typeof resetRequestSchema.parse>;
  if (!(await rateLimit(`reset:ip:${ip}`, 10, 3600)) || !(await rateLimit(`reset:email:${i.email}`, 3, 3600))) return;
  const user = await db.user.findUnique({ where: { email: i.email } });
  if (!user || user.deletedAt || user.status === "SUSPENDED") return;
  const token = await issueToken(user.id, "PASSWORD_RESET", RESET_MINUTES * 60_000);
  await sendMail(
    user.email,
    "Reset your Tessera password",
    `Open this link to choose a new password (valid ${RESET_MINUTES} minutes):\n${appUrl(`/reset-password?token=${token}`)}\nIf you did not request this, ignore this message.`,
  );
  await audit(user.id, "auth.reset_requested", "User", user.id);
}

export async function resetPassword(raw: unknown) {
  const i = parse(resetPasswordSchema, raw) as ReturnType<typeof resetPasswordSchema.parse>;
  const row = await db.authToken.findUnique({ where: { tokenHash: hashToken(i.token) } });
  if (!row || row.purpose !== "PASSWORD_RESET" || row.usedAt || row.expiresAt < new Date())
    throw invalid("This reset link is invalid or has expired.");
  const passwordHash = await hashPassword(i.password);
  await db.$transaction([
    db.authToken.update({ where: { id: row.id }, data: { usedAt: new Date() } }),
    db.user.update({ where: { id: row.userId }, data: { passwordHash } }),
    db.session.deleteMany({ where: { userId: row.userId } }), // sign out everywhere
  ]);
  await audit(row.userId, "auth.password_reset", "User", row.userId);
}

export async function adminExists() {
  return (await db.user.count({ where: { role: "ADMIN", deletedAt: null } })) > 0;
}

/** First-run only: creates the initial administrator. Refuses once any administrator exists. */
export async function setupFirstAdmin(raw: { name?: string; email?: string; password?: string }) {
  const name = raw.name?.trim() ?? "";
  const email = raw.email?.trim().toLowerCase() ?? "";
  const password = raw.password ?? "";
  if (!name) throw invalid("Enter your name.");
  if (!/^\S+@\S+\.\S+$/.test(email)) throw invalid("Enter a valid email address.");
  if (password.length < 14) throw invalid("Use a password of at least 14 characters.");
  const user = await db.$transaction(async (tx) => {
    if ((await tx.user.count({ where: { role: "ADMIN" } })) > 0) throw new AppError("FORBIDDEN", "Setup is already complete.");
    return tx.user.create({
      data: { email, name, passwordHash: await hashPassword(password), role: "ADMIN", status: "ACTIVE", emailVerifiedAt: new Date(), notificationPref: { create: {} } },
    });
  });
  await audit(user.id, "admin.bootstrap", "User", user.id);
  return user;
}

/** Offline replacement for the reset email: returns a single-use link path to hand to the user. */
export async function issueResetLink(userId: string) {
  const user = await db.user.findUnique({ where: { id: userId } });
  if (!user || user.deletedAt) throw notFound("User not found.");
  const token = await issueToken(user.id, "PASSWORD_RESET", RESET_MINUTES * 60_000);
  return { path: `/reset-password?token=${token}`, minutes: RESET_MINUTES, user };
}
