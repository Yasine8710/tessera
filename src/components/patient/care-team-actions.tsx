"use client";

import { Send } from "lucide-react";
import { useState } from "react";
import { acceptInvitationAction, declineInvitationAction, endRelationshipAction, requestConnectionAction } from "@/app/actions/care";
import { Button } from "@/components/ui/button";
import { ConfirmButton } from "@/components/ui/confirm";
import { Field, Input } from "@/components/ui/form";
import { useAction } from "@/components/ui/use-action";
import { ConsentFields, NO_CONSENTS, type ConsentState } from "./consent-fields";

export function InvitationResponse({ invitationId, name }: { invitationId: string; name: string }) {
  const { run, pending, error } = useAction();
  const [consents, setConsents] = useState<ConsentState>(NO_CONSENTS);
  return (
    <div className="space-y-4">
      <ConsentFields value={consents} onChange={setConsents} disabled={pending} />
      {error && (
        <p role="alert" className="text-sm text-danger">
          {error}
        </p>
      )}
      <div className="flex flex-wrap gap-2">
        <Button loading={pending} onClick={() => run(() => acceptInvitationAction({ invitationId }, consents), `You are now connected with ${name}`)}>
          Accept and connect
        </Button>
        <ConfirmButton
          variant="secondary"
          size="md"
          label="Decline"
          title="Decline this invitation?"
          message={`${name} will not get access to your information. They would need to invite you again.`}
          confirmLabel="Decline invitation"
          disabled={pending}
          onConfirm={() => run(() => declineInvitationAction(invitationId), "Invitation declined")}
        />
      </div>
    </div>
  );
}

export function ConnectForm() {
  const { run, pending, error } = useAction();
  const [email, setEmail] = useState("");
  const [consents, setConsents] = useState<ConsentState>(NO_CONSENTS);
  const [fieldError, setFieldError] = useState<string>();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) return setFieldError("Enter a valid email address.");
    setFieldError(undefined);
    if (await run(() => requestConnectionAction(email.trim(), consents), "Request sent. It stays pending until they accept")) {
      setEmail("");
      setConsents(NO_CONSENTS);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4 px-5 py-4">
      <p className="text-sm text-muted">
        Enter the work email of a verified professional on CareSync. They are not connected until they accept your request, and they only see what you choose below.
      </p>
      <Field label="Professional's email" error={fieldError} className="max-w-md">
        {(p) => <Input type="email" autoComplete="off" value={email} onChange={(e) => setEmail(e.target.value)} {...p} />}
      </Field>
      <ConsentFields value={consents} onChange={setConsents} disabled={pending} />
      {error && (
        <p role="alert" className="text-sm text-danger">
          {error}
        </p>
      )}
      <Button type="submit" loading={pending}>
        <Send className="size-4" aria-hidden /> Send request
      </Button>
    </form>
  );
}

export function EndRelationshipButton({ relationshipId, name, pendingRequest }: { relationshipId: string; name: string; pendingRequest?: boolean }) {
  const { run, pending, error } = useAction();
  return (
    <div>
      <ConfirmButton
        label={pendingRequest ? "Cancel request" : "Remove from my care team"}
        title={pendingRequest ? "Cancel this request?" : `Remove ${name} from your care team?`}
        message={
          pendingRequest
            ? "The request will be withdrawn."
            : `${name} will immediately lose access to your information. Past records are kept. You can connect again later.`
        }
        confirmLabel={pendingRequest ? "Cancel request" : "Remove"}
        disabled={pending}
        onConfirm={() => run(() => endRelationshipAction(relationshipId), pendingRequest ? "Request cancelled" : `${name} was removed from your care team`)}
      />
      {error && (
        <p role="alert" className="mt-2 text-sm text-danger">
          {error}
        </p>
      )}
    </div>
  );
}
