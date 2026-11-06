import { Info } from "lucide-react";
import { PageHeader, Alert } from "@/components/ui/card";
import { listNotifications } from "@/server/services/notifications";
import type { Session } from "@/server/session";
import { NotificationList } from "./notification-list";

export async function NotificationsView({ session }: { session: Session }) {
  const rows = await listNotifications(session, 50);
  const items = rows.map((n) => ({
    id: n.id,
    title: n.title,
    body: n.body,
    link: n.link,
    readAt: n.readAt ? n.readAt.toISOString() : null,
    createdAt: n.createdAt.toISOString(),
  }));
  return (
    <div className="max-w-4xl">
      <PageHeader eyebrow="Account" title="Notifications" description="Your most recent in-app notifications." />
      <Alert className="mb-5">
        <span className="inline-flex items-center gap-1.5">
          <Info className="size-4" aria-hidden />
          These are in-app notifications only. Email and push notifications are not delivered unless the operator of this service has configured them.
        </span>
      </Alert>
      <NotificationList items={items} timezone={session.timezone} />
    </div>
  );
}
