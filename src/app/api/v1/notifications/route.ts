import { apiActor, handle } from "@/server/api";
import * as n from "@/server/services/notifications";

export async function GET(req: Request) {
  return handle(async () => {
    const a = await apiActor(req);
    const [items, unread] = await Promise.all([n.listNotifications(a), n.unreadCount(a)]);
    return { unread, items };
  });
}
