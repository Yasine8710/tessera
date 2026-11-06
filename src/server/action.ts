import "server-only";
import { ZodError } from "zod";
import { AppError } from "./errors";
import { getSession, type Session } from "./session";

export type ActionResult<T = void> = { ok: true; data: T } | { ok: false; error: string };

/**
 * Wraps a server action body: maps domain/validation errors to safe messages and
 * never leaks internals. `auth` resolves the signed-in actor server-side on every call.
 */
export async function act<T>(fn: (session: Session) => Promise<T>): Promise<ActionResult<T>> {
  try {
    const session = await getSession();
    if (!session) return { ok: false, error: "Your session has ended. Please sign in again." };
    return { ok: true, data: await fn(session) };
  } catch (e) {
    return { ok: false, error: toMessage(e) };
  }
}

/** For unauthenticated actions (login, register, reset). */
export async function actPublic<T>(fn: () => Promise<T>): Promise<ActionResult<T>> {
  try {
    return { ok: true, data: await fn() };
  } catch (e) {
    return { ok: false, error: toMessage(e) };
  }
}

function toMessage(e: unknown): string {
  if (e instanceof AppError) return e.message;
  if (e instanceof ZodError) return e.issues[0]?.message ?? "Check the form and try again.";
  // Next.js redirect/not-found signals must propagate.
  if (e && typeof e === "object" && "digest" in e) throw e;
  console.error("[action:error]", e instanceof Error ? e.name : "unknown", (e as { code?: string }).code ?? "");
  return "Something went wrong. Please try again.";
}
