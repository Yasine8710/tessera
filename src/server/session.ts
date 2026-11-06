import "server-only";
import type { Role } from "@prisma/client";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { actorFromSession } from "./services/auth";

export const SESSION_COOKIE = "tessera_session";

export async function setSessionCookie(token: string, expiresAt: Date) {
  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production" && process.env.TESSERA_DESKTOP !== "1",
    path: "/",
    expires: expiresAt,
  });
}

export async function clearSessionCookie() {
  (await cookies()).delete(SESSION_COOKIE);
}

export async function readSessionToken() {
  return (await cookies()).get(SESSION_COOKIE)?.value;
}

export const getSession = cache(async () => {
  const token = await readSessionToken();
  return token ? actorFromSession(token) : null;
});

export type Session = NonNullable<Awaited<ReturnType<typeof getSession>>>;

export function homeFor(role: Role) {
  return role === "ADMIN" ? "/admin" : role === "PROFESSIONAL" ? "/staff" : "/patient";
}

/** Page/layout guard. Redirects instead of throwing so unauthenticated users land on /login. */
export async function requireSession(role: Role): Promise<Session> {
  const s = await getSession();
  if (!s) redirect("/login");
  if (s.role !== role) redirect(homeFor(s.role));
  if (role === "PROFESSIONAL" && !s.professionalId) redirect("/pending-approval");
  return s;
}

export async function clientIp() {
  const h = await headers();
  return h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || "unknown";
}
