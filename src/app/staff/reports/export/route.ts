import { AppError } from "@/server/errors";
import { adherenceCsv } from "@/server/services/staff";
import { getSession } from "@/server/session";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const session = await getSession();
  if (!session) return new Response("Sign in required.", { status: 401 });
  if (session.role !== "PROFESSIONAL" || !session.professionalId) return new Response("Forbidden.", { status: 403 });

  const n = Number(new URL(req.url).searchParams.get("days"));
  const days = [7, 30, 90].includes(n) ? n : 30;
  try {
    const csv = await adherenceCsv(session, days);
    return new Response(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="adherence-${days}d.csv"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (e) {
    if (e instanceof AppError) return new Response(e.message, { status: e.code === "FORBIDDEN" ? 403 : 400 });
    return new Response("Could not create the export.", { status: 500 });
  }
}
