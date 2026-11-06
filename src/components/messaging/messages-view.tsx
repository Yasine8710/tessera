import Link from "next/link";
import { ArrowLeft, MessageSquare, ShieldAlert } from "lucide-react";
import { Alert, Card, EmptyState, PageHeader } from "@/components/ui/card";
import { getMessages, listConversations } from "@/server/services/messaging";
import type { Session } from "@/server/session";
import { ConversationList } from "./conversation-list";
import { MessageThread } from "./message-thread";

export async function MessagesView({ session, basePath, selectedId }: { session: Session; basePath: string; selectedId?: string }) {
  const convos = await listConversations(session);
  const items = convos.map((c) => ({ ...c, lastMessageAt: c.lastMessageAt.toISOString() }));
  const active = selectedId ? items.find((c) => c.id === selectedId) : undefined;
  const initial = active
    ? (await getMessages(session, active.id)).map((m) => ({ id: m.id, body: m.body, senderName: m.senderName, createdAt: m.createdAt.toISOString(), mine: m.mine }))
    : [];
  const isPatient = session.role === "PATIENT";
  const emptyHint = isPatient
    ? "A conversation opens automatically when you connect with a care professional."
    : "A conversation opens automatically when a care relationship with a patient starts.";

  return (
    <div>
      <PageHeader title="Messages" description={isPatient ? "Secure messages with your care team." : "Messages with your patients."} />
      <Alert tone="warn" className="mb-4">
        <span className="inline-flex items-start gap-2">
          <ShieldAlert className="mt-0.5 size-4 shrink-0" aria-hidden />
          Tessera messaging is not an emergency service. If you may be in danger, call your local emergency number.
        </span>
      </Alert>
      {selectedId && !active && (
        <Alert tone="danger" className="mb-4">
          That conversation was not found.
        </Alert>
      )}
      <Card className="overflow-hidden md:grid md:h-[calc(100dvh-20rem)] md:min-h-[26rem] md:grid-cols-[18rem_1fr]">
        <div className={active ? "hidden md:block md:overflow-y-auto md:border-r md:border-line" : "md:overflow-y-auto md:border-r md:border-line"}>
          <ConversationList items={items} activeId={active?.id} basePath={basePath} timezone={session.timezone} emptyHint={emptyHint} />
        </div>
        <div className={active ? "flex h-[calc(100dvh-18rem)] min-h-[26rem] flex-col md:h-auto" : "hidden md:flex md:flex-col"}>
          {active ? (
            <>
              <div className="flex items-center gap-2 border-b border-line px-4 py-3">
                <Link href={basePath} className="-ml-2 inline-flex size-8 items-center justify-center rounded-md hover:bg-surface2 md:hidden" aria-label="Back to conversations">
                  <ArrowLeft className="size-4" aria-hidden />
                </Link>
                <h2 className="truncate font-semibold">{active.withName}</h2>
              </div>
              <MessageThread key={active.id} conversationId={active.id} withName={active.withName} initial={initial} timezone={session.timezone} />
            </>
          ) : (
            <EmptyState icon={MessageSquare} title="Select a conversation">
              Choose a conversation from the list to read and reply.
            </EmptyState>
          )}
        </div>
      </Card>
    </div>
  );
}
