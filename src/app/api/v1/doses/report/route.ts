import { apiActor, handle, readJson } from "@/server/api";
import * as clinical from "@/server/services/clinical";

export async function POST(req: Request) {
  return handle(async () => {
    const a = await apiActor(req);
    await clinical.reportIntake(a, await readJson(req));
    return { ok: true };
  });
}
