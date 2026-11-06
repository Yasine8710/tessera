"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Send } from "lucide-react";
import { getMessagesAction, sendMessageAction, type ThreadMessage } from "@/app/actions/messaging";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/form";
import { useAction } from "@/components/ui/use-action";
import { dayKey, formatDay, formatTime } from "@/components/account/format";
import { cn } from "@/lib/cn";

const MAX = 4000;
const POLL_MS = 10_000;

export function MessageThread({ conversationId, withName, initial, timezone }: { conversationId: string; withName: string; initial: ThreadMessage[]; timezone: string }) {
  const [messages, setMessages] = useState(initial);
  const [draft, setDraft] = useState("");
  const [pollError, setPollError] = useState(false);
  const { run, pending, error } = useAction();
  const endRef = useRef<HTMLDivElement>(null);
  const lastId = messages.at(-1)?.id;

  const refresh = useCallback(async () => {
    const r = await getMessagesAction(conversationId);
    if (r.ok) {
      setPollError(false);
      setMessages((prev) => (prev.length === r.data.length && prev.at(-1)?.id === r.data.at(-1)?.id ? prev : r.data));
    } else setPollError(true);
  }, [conversationId]);

  // Poll while the tab is visible; refresh immediately when it becomes visible again.
  useEffect(() => {
    const tick = () => {
      if (!document.hidden) void refresh();
    };
    const timer = setInterval(tick, POLL_MS);
    document.addEventListener("visibilitychange", tick);
    return () => {
      clearInterval(timer);
      document.removeEventListener("visibilitychange", tick);
    };
  }, [refresh]);

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    endRef.current?.scrollIntoView({ block: "end", behavior: reduce ? "auto" : "smooth" });
  }, [lastId]);

  const over = draft.length > MAX;
  const empty = draft.trim().length === 0;

  function send() {
    if (empty || over || pending) return;
    void run(
      () => sendMessageAction(conversationId, draft),
      undefined,
      () => {
        setDraft("");
        void refresh();
      },
    );
  }

  let lastDay = "";
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-4 py-4" role="log" aria-label={`Conversation with ${withName}`} tabIndex={0}>
        {messages.length === 0 && <p className="py-10 text-center text-sm text-muted">No messages yet. Say hello to {withName}.</p>}
        {messages.map((m) => {
          const k = dayKey(m.createdAt, timezone);
          const header = k !== lastDay;
          lastDay = k;
          return (
            <div key={m.id}>
              {header && <p className="my-2 text-center text-xs font-medium text-muted">{formatDay(m.createdAt, timezone)}</p>}
              <div className={cn("flex", m.mine ? "justify-end" : "justify-start")}>
                <div className={cn("anim-scale max-w-[85%] rounded-lg px-3.5 py-2 sm:max-w-[70%]", m.mine ? "bg-accent text-onaccent" : "border border-line bg-surface2 text-ink")}>
                  <p className={cn("text-xs font-semibold", m.mine ? "text-onaccent/85" : "text-ink2")}>{m.mine ? "You" : m.senderName}</p>
                  <p className="whitespace-pre-wrap break-words text-[0.95rem]">{m.body}</p>
                  <time dateTime={m.createdAt} className={cn("mt-0.5 block text-right text-xs", m.mine ? "text-onaccent/80" : "text-muted")}>
                    {formatTime(m.createdAt, timezone)}
                  </time>
                </div>
              </div>
            </div>
          );
        })}
        <div ref={endRef} />
      </div>
      {pollError && <p className="px-4 pb-1 text-xs text-warn">Could not refresh messages. Retrying.</p>}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          send();
        }}
        className="border-t border-line p-3"
      >
        <label htmlFor="msg-body" className="sr-only">
          Message to {withName}
        </label>
        <Textarea
          id="msg-body"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
              e.preventDefault();
              send();
            }
          }}
          rows={2}
          placeholder="Write a message. Enter to send, Shift+Enter for a new line."
          aria-invalid={over || undefined}
          aria-describedby="msg-count"
          disabled={pending}
          className="min-h-16 resize-y"
        />
        <div className="mt-2 flex items-center justify-between gap-3">
          <p id="msg-count" className={cn("text-xs", over ? "font-semibold text-danger" : "text-muted")}>
            {draft.length} / {MAX}
          </p>
          <Button type="submit" size="sm" loading={pending} disabled={empty || over}>
            <Send className="size-4" aria-hidden /> Send
          </Button>
        </div>
        {error && <p role="alert" className="mt-2 text-sm text-danger">{error}</p>}
      </form>
    </div>
  );
}
