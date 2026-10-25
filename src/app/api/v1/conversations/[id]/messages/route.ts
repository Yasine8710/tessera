import { apiActor, handle, readJson } from "@/server/api";
import * as m from "@/server/services/messaging";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(req: Request, { params }: Ctx) {
  return handle(async () => {
    const a = await apiActor(req);
    const before = new URL(req.url).searchParams.get("before") ?? undefined;
    return m.getMessages(a, (await params).id, { before });
  });
}

export async function POST(req: Request, { params }: Ctx) {
  return handle(async () => {
    const a = await apiActor(req);
    const body = (await readJson(req)) as { body?: string };
    const msg = await m.sendMessage(a, { conversationId: (await params).id, body: body.body });
    return { id: msg.id, createdAt: msg.createdAt };
  }, 201);
}
