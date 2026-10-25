"use client";

import { createContext, useCallback, useContext, useState } from "react";
import { CheckCircle2, XCircle } from "lucide-react";
import { cn } from "@/lib/cn";

type T = { id: number; text: string; tone: "ok" | "danger" };
const Ctx = createContext<(text: string, tone?: T["tone"]) => void>(() => undefined);

export const useToast = () => useContext(Ctx);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<T[]>([]);
  const push = useCallback((text: string, tone: T["tone"] = "ok") => {
    const id = Date.now() + Math.random();
    setItems((x) => [...x, { id, text, tone }]);
    setTimeout(() => setItems((x) => x.filter((i) => i.id !== id)), 5000);
  }, []);
  return (
    <Ctx.Provider value={push}>
      {children}
      <div aria-live="polite" className="pointer-events-none fixed inset-x-0 bottom-4 z-50 flex flex-col items-center gap-2 px-4">
        {items.map((t) => (
          <div key={t.id} className={cn("pointer-events-auto flex items-center gap-2 rounded-md px-4 py-2.5 text-sm font-medium text-white shadow-md", t.tone === "ok" ? "bg-nav" : "bg-danger")}>
            {t.tone === "ok" ? <CheckCircle2 className="size-4" aria-hidden /> : <XCircle className="size-4" aria-hidden />}
            {t.text}
          </div>
        ))}
      </div>
    </Ctx.Provider>
  );
}
