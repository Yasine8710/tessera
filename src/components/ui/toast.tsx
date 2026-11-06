"use client";

import { createContext, useCallback, useContext, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { CheckCircle2, X, XCircle } from "lucide-react";
import { cn } from "@/lib/cn";

type T = { id: number; text: string; tone: "ok" | "danger" };
const Ctx = createContext<(text: string, tone?: T["tone"]) => void>(() => undefined);

export const useToast = () => useContext(Ctx);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<T[]>([]);
  const dismiss = useCallback((id: number) => setItems((x) => x.filter((i) => i.id !== id)), []);
  const push = useCallback(
    (text: string, tone: T["tone"] = "ok") => {
      const id = Date.now() + Math.random();
      setItems((x) => [...x.slice(-3), { id, text, tone }]);
      setTimeout(() => dismiss(id), 5000);
    },
    [dismiss],
  );
  return (
    <Ctx.Provider value={push}>
      {children}
      <div aria-live="polite" className="pointer-events-none fixed inset-x-0 bottom-4 z-50 flex flex-col items-center gap-2 px-4">
        <AnimatePresence initial={false}>
          {items.map((t) => (
            <motion.div
              key={t.id}
              layout
              initial={{ opacity: 0, y: 16, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.97, transition: { duration: 0.15 } }}
              transition={{ duration: 0.24, ease: [0.2, 0.7, 0.2, 1] }}
              className={cn(
                "pointer-events-auto flex items-center gap-2 rounded-md border px-3.5 py-2.5 text-sm font-medium shadow-md",
                t.tone === "ok" ? "border-line2 bg-surface text-ink" : "border-danger/40 bg-danger-soft text-danger",
              )}
            >
              {t.tone === "ok" ? <CheckCircle2 className="size-4 shrink-0 text-ok" aria-hidden /> : <XCircle className="size-4 shrink-0" aria-hidden />}
              {t.text}
              <button type="button" aria-label="Dismiss notification" onClick={() => dismiss(t.id)} className="-mr-1 ml-1 inline-flex size-6 items-center justify-center rounded-sm text-muted hover:bg-surface2 hover:text-ink">
                <X className="size-3.5" aria-hidden />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </Ctx.Provider>
  );
}
