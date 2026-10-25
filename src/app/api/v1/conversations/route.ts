import { apiActor, handle } from "@/server/api";
import * as m from "@/server/services/messaging";

export async function GET(req: Request) {
  return handle(async () => m.listConversations(await apiActor(req)));
}
