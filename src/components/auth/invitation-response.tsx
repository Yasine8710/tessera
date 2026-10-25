"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { acceptInvitationAction, declineInvitationAction } from "@/app/actions/care";
import { Alert } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/form";
import { ConfirmButton } from "@/components/ui/confirm";
import { useAction } from "@/components/ui/use-action";

const CONSENTS = [
  { key: "JOURNAL", label: "Health journal entries you choose to share", hint: "Wellbeing, pain scores, symptoms and notes, only entries you mark as shared." },
  { key: "MEASUREMENTS", label: "Measurements", hint: "Values you record yourself, such as blood pressure or weight." },
  { key: "ROUTINES", label: "Routines", hint: "Your daily routines and whether you marked them done." },
  { key: "MEDICATION_ADHERENCE", label: "Medication adherence", hint: "Whether you marked scheduled doses as taken or skipped." },
] as const;

type Key = (typeof CONSENTS)[number]["key"];

export function InvitationResponse({ token, invitationId, professionalName }: { token: string; invitationId: string; professionalName: string }) {
  const router = useRouter();
  const { run, pending, error } = useAction();
  const [choice, setChoice] = useState<Record<Key, boolean>>({ JOURNAL: false, MEASUREMENTS: false, ROUTINES: false, MEDICATION_ADHERENCE: false });

  return (
    <div className="space-y-5">
      <fieldset className="rounded-lg border border-line bg-surface p-4">
        <legend className="px-1 text-sm font-semibold">What you share with {professionalName}</legend>
        <p className="mb-3 text-sm text-muted">
          You choose. Everything is off by default. What you record stays visible to you either way, and you can change these at any time from your care team page.
        </p>
        <div className="space-y-3">
          {CONSENTS.map((c) => (
            <Checkbox
              key={c.key}
              label={c.label}
              hint={c.hint}
              checked={choice[c.key]}
              onChange={(e) => setChoice((p) => ({ ...p, [c.key]: e.target.checked }))}
            />
          ))}
        </div>
      </fieldset>

      {error && <Alert tone="danger">{error}</Alert>}

      <div className="flex flex-wrap gap-2">
        <Button type="button" loading={pending} onClick={() => run(() => acceptInvitationAction({ token }, choice), "Connected to your care team", () => router.push("/patient/care-team"))}>
          Accept and connect
        </Button>
        <ConfirmButton
          label="Decline"
          variant="secondary"
          size="md"
          title="Decline this invitation?"
          message="The invitation will be closed. The professional will need to invite you again if this was a mistake."
          confirmLabel="Decline invitation"
          disabled={pending}
          onConfirm={() => void run(() => declineInvitationAction(invitationId), "Invitation declined", () => router.push("/patient"))}
        />
      </div>
    </div>
  );
}
