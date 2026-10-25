import { clientIpFrom, handle, readJson } from "@/server/api";
import * as auth from "@/server/services/auth";

export async function POST(req: Request) {
  return handle(async () => {
    const s = await auth.login(await readJson(req), clientIpFrom(req), req.headers.get("user-agent") ?? undefined);
    return { token: s.token, expiresAt: s.expiresAt, role: s.role };
  });
}
