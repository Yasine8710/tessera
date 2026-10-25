import Link from "next/link";
import { MessageSquare } from "lucide-react";
import { EmptyState } from "@/components/ui/card";
import { formatDateTime } from "@/components/account/format";
import { cn } from "@/lib/cn";

export type ConversationRow = { id: string; withName: string; preview: string; unread: number; lastMessageAt: string };

export function ConversationList({ items, activeId, basePath, timezone, emptyHint }: { items: ConversationRow[]; activeId?: string; basePath: string; timezone: string; emptyHint: string }) {
  if (items.length === 0) {
    return (
      <EmptyState icon={MessageSquare} title="No conversations yet">
        {emptyHint}
      </EmptyState>
    );
  }
  return (
    <ul aria-label="Conversations" className="divide-y divide-line">
      {items.map((c) => (
        <li key={c.id}>
          <Link
            href={`${basePath}?c=${encodeURIComponent(c.id)}`}
            aria-current={c.id === activeId ? "page" : undefined}
            className={cn("block px-4 py-3 hover:bg-surface2", c.id === activeId && "bg-accent-soft")}
          >
            <span className="flex items-baseline justify-between gap-2">
              <span className={cn("truncate", c.unread > 0 ? "font-semibold" : "font-medium")}>{c.withName}</span>
              <time dateTime={c.lastMessageAt} className="shrink-0 text-xs text-muted">
                {formatDateTime(c.lastMessageAt, timezone)}
              </time>
            </span>
            <span className="mt-0.5 flex items-center justify-between gap-2">
              <span className="truncate text-sm text-muted">{c.preview}</span>
              {c.unread > 0 && (
                <span className="shrink-0 rounded-full bg-accent px-1.5 text-xs font-bold leading-5 text-white">
                  {c.unread}
                  <span className="sr-only"> unread</span>
                </span>
              )}
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
