import { apiActor, handle } from "@/server/api";
import * as auth from "@/server/services/auth";

export async function POST(req: Request) {
  return handle(async () => {
    await apiActor(req);
    await auth.logout(req.headers.get("authorization")!.slice(7));
    return { ok: true };
  });
}
