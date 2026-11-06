"use client";

import { demoLoginAction } from "@/app/actions/auth";
import { Alert } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAction } from "@/components/ui/use-action";

/** One button per role. Shown on the sign-in screen and on first-run setup so the demo is always reachable. */
export function DemoPanel({ className }: { className?: string }) {
  const { run, pending, error } = useAction();
  return (
    <section aria-labelledby="demo-h" className={`anim-up rounded-lg border border-line bg-surface2 p-4 ${className ?? ""}`}>
      <h2 id="demo-h" className="text-sm font-semibold">
        Try the demo
      </h2>
      <p className="mt-1 text-sm text-muted">
        Sign in to a shared demo account for each role. All data in it is synthetic and for illustration only, and the demo administrator can only look, not change anything. Do not enter real personal or health information.
      </p>
      {error && <Alert tone="danger" className="mt-3">{error}</Alert>}
      <div className="mt-3 flex flex-wrap gap-2">
        <Button type="button" variant="secondary" disabled={pending} onClick={() => run(() => demoLoginAction("patient"))}>
          Demo as patient
        </Button>
        <Button type="button" variant="secondary" disabled={pending} onClick={() => run(() => demoLoginAction("staff"))}>
          Demo as medical staff
        </Button>
        <Button type="button" variant="secondary" disabled={pending} onClick={() => run(() => demoLoginAction("admin"))}>
          Demo as administrator
        </Button>
      </div>
    </section>
  );
}
