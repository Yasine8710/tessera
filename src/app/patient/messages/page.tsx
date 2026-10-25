import type { Metadata } from "next";
import { MessagesView } from "@/components/messaging/messages-view";
import { requireSession } from "@/server/session";

export const metadata: Metadata = { title: "Messages" };

export default async function Page({ searchParams }: { searchParams: Promise<{ c?: string }> }) {
  const { c } = await searchParams;
  return <MessagesView session={await requireSession("PATIENT")} basePath="/patient/messages" selectedId={typeof c === "string" ? c : undefined} />;
}
