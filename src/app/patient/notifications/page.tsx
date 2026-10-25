import type { Metadata } from "next";
import { NotificationsView } from "@/components/account/notifications-view";
import { requireSession } from "@/server/session";

export const metadata: Metadata = { title: "Notifications" };

export default async function Page() {
  return <NotificationsView session={await requireSession("PATIENT")} />;
}
