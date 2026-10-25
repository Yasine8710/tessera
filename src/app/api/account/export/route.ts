import { NextResponse } from "next/server";
import { exportMyData } from "@/server/services/account";
import { getSession } from "@/server/session";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Sign in to download your data." }, { status: 401, headers: { "Cache-Control": "no-store" } });
  const data = await exportMyData(session);
  const stamp = new Date().toISOString().slice(0, 10);
  return new NextResponse(JSON.stringify(data, null, 2), {
    status: 200,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="caresync-data-${stamp}.json"`,
      "Cache-Control": "no-store",
    },
  });
}
