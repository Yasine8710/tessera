import { apiActor, handle, readJson } from "@/server/api";
import * as n from "@/server/services/notifications";

export async function POST(req: Request) {
  return handle(async () => {
    const a = await apiActor(req);
    const body = (await readJson(req)) as { id?: string };
    await n.markRead(a, body.id);
    return { ok: true };
  });
}
