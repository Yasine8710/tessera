"use client";

import { useEffect, useRef } from "react";
import { unreadSinceAction } from "@/app/actions/account";
import { logoutAction } from "@/app/actions/auth";

declare global {
  interface Window {
    tesseraDesktop?: { notify(count: number): void; onLock(cb: () => void): void };
  }
}

const IDLE_MS = 15 * 60_000;
const POLL_MS = 45_000;

/** Desktop only: OS toasts for new notifications, and sign-out on idle or when Windows locks. */
export function DesktopBridge() {
  const since = useRef(new Date().toISOString());

  useEffect(() => {
    const bridge = window.tesseraDesktop;
    let idle: ReturnType<typeof setTimeout>;
    const lock = () => {
      void logoutAction().catch(() => {});
    };
    const arm = () => {
      clearTimeout(idle);
      idle = setTimeout(lock, IDLE_MS);
    };
    const events = ["pointerdown", "keydown", "wheel", "touchstart"] as const;
    events.forEach((e) => window.addEventListener(e, arm, { passive: true }));
    arm();
    bridge?.onLock(lock);

    const poll = setInterval(async () => {
      const r = await unreadSinceAction(since.current).catch(() => null);
      if (r?.ok && r.data > 0) {
        since.current = new Date().toISOString();
        bridge?.notify(r.data);
      }
    }, POLL_MS);

    return () => {
      clearTimeout(idle);
      clearInterval(poll);
      events.forEach((e) => window.removeEventListener(e, arm));
    };
  }, []);

  return null;
}
