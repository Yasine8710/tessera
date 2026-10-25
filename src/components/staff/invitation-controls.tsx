"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Check, Copy } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import type { z } from "zod";
import { createInvitationAction, endRelationshipAction, respondToRequestAction, revokeInvitationAction } from "@/app/actions/care";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/card";
import { ConfirmButton } from "@/components/ui/confirm";
import { Field, Input } from "@/components/ui/form";
import { useToast } from "@/components/ui/toast";
import { useAction } from "@/components/ui/use-action";
import { inviteSchema } from "@/lib/schemas";

type In = z.input<typeof inviteSchema>;
type Out = z.output<typeof inviteSchema>;
type Created = { acceptUrl: string; emailDelivered: boolean };

function CopyLink({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);
  const toast = useToast();
  return (
    <div className="flex flex-wrap items-center gap-2">
      <input readOnly aria-label="One-time invitation link" value={url} onFocus={(e) => e.currentTarget.select()} className="h-10 min-w-0 flex-1 rounded-md border border-line2 bg-surface px-3 text-sm" />
      <Button
        type="button"
        variant="secondary"
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(url);
            setCopied(true);
            toast("Link copied");
          } catch {
            toast("Could not copy. Select the link and copy it manually.", "danger");
          }
        }}
      >
        {copied ? <Check className="size-4" aria-hidden /> : <Copy className="size-4" aria-hidden />} {copied ? "Copied" : "Copy link"}
      </Button>
    </div>
  );
}

export function InviteForm() {
  const { run, pending, error } = useAction();
  const [created, setCreated] = useState<Created | null>(null);
  const { register, handleSubmit, reset, formState: { errors } } = useForm<In, unknown, Out>({ resolver: zodResolver(inviteSchema), defaultValues: { patientEmail: "" } });
  return (
    <div className="space-y-4">
      <form
        noValidate
        className="flex flex-wrap items-start gap-3"
        onSubmit={handleSubmit((v) => {
          setCreated(null);
          return run(() => createInvitationAction(v), "Invitation created", (d) => {
            setCreated(d);
            reset();
          });
        })}
      >
        <div className="min-w-64 flex-1">
          <Field label="Patient email" hint="The patient chooses what to share when they accept." error={errors.patientEmail?.message}>
            {(a) => <Input type="email" autoComplete="off" {...a} {...register("patientEmail")} />}
          </Field>
        </div>
        <Button type="submit" loading={pending} className="mt-[1.65rem]">Create invitation</Button>
      </form>
      {error && <Alert tone="danger">{error}</Alert>}
      {created && (
        <Alert tone={created.emailDelivered ? "ok" : "warn"} title={created.emailDelivered ? "Invitation emailed" : "Email is not configured"}>
          <div className="space-y-2">
            <p>
              {created.emailDelivered
                ? "An email with this link was sent. You can also share the link yourself."
                : "No email was sent. Share this link securely yourself."}{" "}
              It works once, expires in 7 days, and cannot be shown again after you leave this page.
            </p>
            <CopyLink url={created.acceptUrl} />
          </div>
        </Alert>
      )}
    </div>
  );
}

export function RevokeInvitationButton({ id, email }: { id: string; email: string }) {
  const { run } = useAction();
  return (
    <ConfirmButton
      label="Revoke"
      title="Revoke this invitation?"
      message={`The link sent to ${email} will stop working.`}
      confirmLabel="Revoke invitation"
      onConfirm={() => void run(() => revokeInvitationAction(id), "Invitation revoked")}
    />
  );
}

export function RequestActions({ relationshipId, name }: { relationshipId: string; name: string }) {
  const { run, pending } = useAction();
  return (
    <div className="flex gap-2">
      <Button size="sm" loading={pending} aria-label={`Accept request from ${name}`} onClick={() => void run(() => respondToRequestAction(relationshipId, true), "Request accepted")}>Accept</Button>
      <ConfirmButton
        variant="secondary"
        label="Decline"
        title="Decline this request?"
        message={`${name} will not be connected to you and cannot see you as part of their care team.`}
        confirmLabel="Decline request"
        onConfirm={() => void run(() => respondToRequestAction(relationshipId, false), "Request declined")}
      />
    </div>
  );
}

export function EndRelationshipButton({ relationshipId, name }: { relationshipId: string; name: string }) {
  const { run } = useAction();
  const router = useRouter();
  return (
    <ConfirmButton
      label="End care relationship"
      title={`End your care relationship with ${name}?`}
      message="Your access to this patient's information stops immediately. History is kept, and either of you can reconnect later."
      confirmLabel="End relationship"
      onConfirm={() => void run(() => endRelationshipAction(relationshipId), "Care relationship ended", () => router.replace("/staff/patients"))}
    />
  );
}
