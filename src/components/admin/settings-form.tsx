"use client";

import { useState } from "react";
import { setDemoEnabledAction, setStaleDaysAction, setSupportEmailAction } from "@/app/actions/admin";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/form";
import { useAction } from "@/components/ui/use-action";

export function SettingsForm({ staleDays, supportEmail, demoEnabled }: { staleDays: number; supportEmail: string; demoEnabled?: boolean }) {
  const [days, setDays] = useState(String(staleDays));
  const [email, setEmail] = useState(supportEmail);
  const a1 = useAction();
  const a2 = useAction();
  const a3 = useAction();
  const n = Number(days);
  const daysValid = Number.isInteger(n) && n >= 1 && n <= 30;

  return (
    <div className="space-y-5 px-5 py-5">
      <form
        className="flex flex-wrap items-end gap-3"
        onSubmit={(e) => {
          e.preventDefault();
          void a1.run(() => setStaleDaysAction(n), "Setting saved");
        }}
      >
        <Field label="Stale-data threshold (days)" hint="Threshold, in days, for staff stale-data flags. 1 to 30." error={a1.error ?? (!daysValid ? "Enter a whole number from 1 to 30." : undefined)} className="w-full sm:w-72">
          {(a) => <Input type="number" inputMode="numeric" min={1} max={30} value={days} onChange={(e) => setDays(e.target.value)} {...a} />}
        </Field>
        <Button type="submit" loading={a1.pending} disabled={!daysValid || n === staleDays}>
          Save
        </Button>
      </form>
      <form
        className="flex flex-wrap items-end gap-3"
        onSubmit={(e) => {
          e.preventDefault();
          void a2.run(() => setSupportEmailAction(email), "Setting saved");
        }}
      >
        <Field label="Support email" hint="Shown to users who need help." error={a2.error ?? undefined} className="w-full sm:w-72">
          {(a) => <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} {...a} />}
        </Field>
        <Button type="submit" loading={a2.pending} disabled={email.trim() === supportEmail}>
          Save
        </Button>
      </form>
      {demoEnabled !== undefined && (
        <div className="space-y-1.5 border-t border-line pt-5">
          <p className="text-sm font-medium text-ink">Demo accounts</p>
          <p className="text-sm text-muted">
            The sign-in screen offers a demo patient, clinician and administrator with synthetic data. The demo administrator is read-only and sees demo accounts only.
          </p>
          <div className="flex items-center gap-3">
            <span className="text-sm text-ink2" aria-live="polite">{demoEnabled ? "Shown on the sign-in screen" : "Hidden"}</span>
            <Button variant="secondary" loading={a3.pending} onClick={() => void a3.run(() => setDemoEnabledAction(!demoEnabled), demoEnabled ? "Demo accounts hidden" : "Demo accounts shown")}>
              {demoEnabled ? "Hide demo accounts" : "Show demo accounts"}
            </Button>
          </div>
          {a3.error && <p role="alert" className="text-sm text-danger">{a3.error}</p>}
        </div>
      )}
    </div>
  );
}
