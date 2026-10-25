import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { runReminderJob } from "@/server/services/notifications";

export const dynamic = "force-dynamic";

function authorised(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const given = req.headers.get("authorization")?.replace(/^Bearer /, "") ?? "";
  const a = Buffer.from(given);
  const b = Buffer.from(secret);
  return a.length === b.length && timingSafeEqual(a, b);
}

/** Idempotent. Call every ~5 minutes from any scheduler (see docs/DEPLOYMENT.md). */
export async function POST(req: Request) {
  if (!authorised(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const result = await runReminderJob();
  return NextResponse.json(result);
}
