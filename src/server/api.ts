import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { AppError, type ErrorCode } from "./errors";
import { actorFromSession } from "./services/auth";

const STATUS: Record<ErrorCode, number> = {
  UNAUTHENTICATED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  INVALID: 400,
  CONFLICT: 409,
  RATE_LIMITED: 429,
};

export function clientIpFrom(req: Request) {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
}

/** Bearer-token auth for non-browser clients. Same Actor and same service-layer authorization as the web app. */
export async function apiActor(req: Request) {
  const token = req.headers.get("authorization")?.match(/^Bearer (.+)$/)?.[1];
  const actor = token ? await actorFromSession(token) : null;
  if (!actor) throw new AppError("UNAUTHENTICATED", "Missing or invalid bearer token.");
  return actor;
}

export async function handle(fn: () => Promise<unknown>, okStatus = 200) {
  try {
    const data = await fn();
    return NextResponse.json({ data }, { status: okStatus, headers: { "Cache-Control": "no-store" } });
  } catch (e) {
    if (e instanceof AppError) return NextResponse.json({ error: { code: e.code, message: e.message } }, { status: STATUS[e.code] });
    if (e instanceof ZodError) return NextResponse.json({ error: { code: "INVALID", message: e.issues[0]?.message ?? "Invalid input." } }, { status: 400 });
    console.error("[api:error]", e instanceof Error ? e.name : "unknown");
    return NextResponse.json({ error: { code: "INTERNAL", message: "Something went wrong." } }, { status: 500 });
  }
}

export async function readJson(req: Request): Promise<unknown> {
  try {
    return await req.json();
  } catch {
    throw new AppError("INVALID", "Request body must be JSON.");
  }
}
