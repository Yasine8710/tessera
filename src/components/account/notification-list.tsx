"use client";

import Link from "next/link";
import { Check, CheckCheck } from "lucide-react";
import { markNotificationReadAction } from "@/app/actions/account";
import { Button } from "@/components/ui/button";
import { Card, EmptyState } from "@/components/ui/card";
import { useAction } from "@/components/ui/use-action";
import { cn } from "@/lib/cn";
import { formatDateTime } from "./format";

export type NotificationRow = { id: string; title: string; body: string; link: string | null; readAt: string | null; createdAt: string };

export function NotificationList({ items, timezone }: { items: NotificationRow[]; timezone: string }) {
  const { run, pending, error } = useAction();
  const unread = items.filter((n) => !n.readAt).length;

  return (
    <div>
      <div className="mb-3 flex items-center justify-between gap-3">
        <p className="text-sm text-muted" aria-live="polite">
          {unread > 0 ? `${unread} unread` : "All caught up"}
        </p>
        <Button variant="secondary" size="sm" disabled={unread === 0 || pending} loading={pending} onClick={() => run(() => markNotificationReadAction(), "All notifications marked as read")}>
          <CheckCheck className="size-4" aria-hidden /> Mark all read
        </Button>
      </div>
      {error && <p role="alert" className="mb-3 text-sm text-danger">{error}</p>}
      <Card>
        {items.length === 0 ? (
          <EmptyState photo="walk-coat" title="No notifications yet">
            Reminders, approvals and message alerts will appear here.
          </EmptyState>
        ) : (
          <ul className="stagger divide-y divide-line">
            {items.map((n) => (
              <li key={n.id} className={cn("flex items-start gap-3 border-l-2 px-5 py-4", n.readAt ? "border-l-transparent" : "border-l-accent bg-accent-soft/50")}>
                <span className={cn("mt-2 size-2 shrink-0 rounded-full", n.readAt ? "bg-transparent" : "bg-accent")} aria-hidden />
                <div className="min-w-0 flex-1">
                  <p className={cn(!n.readAt && "font-semibold")}>
                    {!n.readAt && <span className="sr-only">Unread: </span>}
                    {n.title}
                  </p>
                  <p className="text-sm text-ink2">{n.body}</p>
                  <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
                    <time dateTime={n.createdAt} className="text-muted">
                      {formatDateTime(n.createdAt, timezone)}
                    </time>
                    {n.link && (
                      <Link href={n.link} className="font-medium text-accent underline underline-offset-2">
                        Open
                      </Link>
                    )}
                  </div>
                </div>
                {!n.readAt && (
                  <Button variant="ghost" size="sm" disabled={pending} onClick={() => run(() => markNotificationReadAction(n.id))} aria-label={`Mark "${n.title}" as read`}>
                    <Check className="size-4" aria-hidden /> Read
                  </Button>
                )}
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
