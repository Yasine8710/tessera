"use client";

import { approveProfessionalAction, rejectProfessionalAction } from "@/app/actions/admin";
import { ConfirmButton } from "@/components/ui/confirm";
import { useAction } from "@/components/ui/use-action";

export function ApprovalActions({ userId, name }: { userId: string; name: string }) {
  const { run, pending, error } = useAction();
  return (
    <div>
      <div className="flex flex-wrap gap-2">
        <ConfirmButton
          label="Approve"
          variant="secondary"
          title={`Approve ${name}?`}
          message="Only approve after you have verified the licence number with the issuing body. They will gain access to the staff portal."
          confirmLabel="Approve"
          disabled={pending}
          onConfirm={() => void run(() => approveProfessionalAction(userId), "Professional approved")}
        />
        <ConfirmButton
          label="Reject"
          title={`Reject ${name}?`}
          message="The account will be suspended and the person will not get staff access."
          confirmLabel="Reject"
          disabled={pending}
          onConfirm={() => void run(() => rejectProfessionalAction(userId), "Application rejected")}
        />
        {pending && <span className="self-center text-sm text-muted" role="status">Working...</span>}
      </div>
      {error && <p role="alert" className="mt-2 text-sm text-danger">{error}</p>}
    </div>
  );
}
