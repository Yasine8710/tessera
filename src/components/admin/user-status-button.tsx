"use client";

import { setUserStatusAction } from "@/app/actions/admin";
import { ConfirmButton } from "@/components/ui/confirm";
import { useAction } from "@/components/ui/use-action";

export function UserStatusButton({ userId, name, status }: { userId: string; name: string; status: "ACTIVE" | "SUSPENDED" }) {
  const { run, pending, error } = useAction();
  const suspend = status === "ACTIVE";
  return (
    <div>
      <ConfirmButton
        label={suspend ? "Suspend" : "Reactivate"}
        variant={suspend ? "danger" : "secondary"}
        title={suspend ? `Suspend ${name}?` : `Reactivate ${name}?`}
        message={suspend ? "They are signed out immediately and cannot sign in until reactivated." : "They will be able to sign in again."}
        confirmLabel={suspend ? "Suspend" : "Reactivate"}
        disabled={pending}
        onConfirm={() => void run(() => setUserStatusAction(userId, suspend ? "SUSPENDED" : "ACTIVE"), suspend ? "User suspended" : "User reactivated")}
      />
      {error && <p role="alert" className="mt-1 max-w-48 text-xs text-danger">{error}</p>}
    </div>
  );
}
