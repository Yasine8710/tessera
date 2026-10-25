import { apiActor, handle } from "@/server/api";

export async function GET(req: Request) {
  return handle(async () => {
    const a = await apiActor(req);
    return { userId: a.userId, role: a.role, timezone: a.timezone, patientId: a.patientId ?? null, professionalId: a.professionalId ?? null };
  });
}
