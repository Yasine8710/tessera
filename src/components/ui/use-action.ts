"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { useToast } from "./toast";

type Result<T> = { ok: true; data: T } | { ok: false; error: string };

/**
 * Runs a server action with pending + error state, toasts success, and refreshes server data.
 * `run(() => someAction(...), "Saved")` resolves true on success.
 */
export function useAction() {
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const toast = useToast();
  const router = useRouter();

  function run<T>(fn: () => Promise<Result<T>>, success?: string, after?: (d: T) => void): Promise<boolean> {
    return new Promise((resolve) => {
      start(async () => {
        setError(null);
        const r = await fn();
        if (r.ok) {
          if (success) toast(success);
          after?.(r.data);
          router.refresh();
        } else {
          setError(r.error);
          toast(r.error, "danger");
        }
        resolve(r.ok);
      });
    });
  }
  return { run, pending, error, clearError: () => setError(null) };
}
