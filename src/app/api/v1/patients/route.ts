import { apiActor, handle } from "@/server/api";
import * as care from "@/server/services/care";

export async function GET(req: Request) {
  return handle(async () => {
    const a = await apiActor(req);
    const p = new URL(req.url).searchParams;
    const r = await care.listPatients(a, { q: p.get("q") ?? undefined, page: Number(p.get("page") ?? 1) });
    return {
      total: r.total,
      page: r.page,
      pageSize: r.pageSize,
      items: r.rows.map((x) => ({ patientId: x.patientId, name: x.patient.user.name, since: x.startedAt })),
    };
  });
}
