import { apiActor, handle } from "@/server/api";
import * as clinical from "@/server/services/clinical";

export async function GET(req: Request) {
  return handle(async () => {
    const a = await apiActor(req);
    const doses = await clinical.listDoses(a);
    return doses.map((d) => ({
      id: d.id,
      medication: d.plan.medication.name,
      dose: d.plan.dose,
      scheduledFor: d.scheduledFor,
      status: d.effectiveStatus,
      takenAt: d.takenAt,
      note: d.note,
    }));
  });
}
