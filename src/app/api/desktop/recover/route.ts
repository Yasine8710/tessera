import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { db } from "@/server/db";
import { isDesktop } from "@/server/desktop";
import { audit } from "@/server/audit";
import { issueResetLink } from "@/server/services/auth";

export const dynamic = "force-dynamic";

/** Called only by the desktop shell (Help > Reset administrator password) with the per-install secret. */
export async function POST(req: Request) {
  const secret = process.env.CRON_SECRET;
  const given = req.headers.get("authorization")?.replace(/^Bearer /, "") ?? "";
  if (!isDesktop() || !secret || given.length !== secret.length || !timingSafeEqual(Buffer.from(given), Buffer.from(secret)))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { email } = (await req.json().catch(() => ({}))) as { email?: string };
  const admin = await db.user.findFirst({ where: { email: email?.trim().toLowerCase(), role: "ADMIN", deletedAt: null } });
  if (!admin) return NextResponse.json({ error: "No administrator with that email." }, { status: 404 });
  const r = await issueResetLink(admin.id);
  await audit(admin.id, "admin.recovery_link_issued", "User", admin.id);
  return NextResponse.json({ path: r.path });
}
