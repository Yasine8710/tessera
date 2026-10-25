"use client";

import { useState } from "react";
import { deleteAccountAction } from "@/app/actions/account";
import { ConfirmButton } from "@/components/ui/confirm";
import { Field, Input } from "@/components/ui/form";
import { useAction } from "@/components/ui/use-action";

export function DeleteAccount() {
  const [password, setPassword] = useState("");
  const { run, pending, error } = useAction();

  return (
    <div className="space-y-4 px-5 py-5">
      <div className="space-y-2 text-sm text-ink2">
        <p>Deleting your account ends access immediately and cannot be undone. In plain terms:</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>You are signed out everywhere and your sign-in details stop working.</li>
          <li>Your name, email and contact details are removed or replaced with placeholders.</li>
          <li>Your active care connections are ended.</li>
          <li>Clinical records may be kept in de-identified form where the law requires it.</li>
        </ul>
        <p>Consider downloading your data first.</p>
      </div>
      <Field label="Confirm your password" error={error ?? undefined}>
        {(a) => <Input type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} className="max-w-sm" {...a} />}
      </Field>
      <ConfirmButton
        label={pending ? "Deleting..." : "Delete my account"}
        title="Delete your account?"
        message="This ends your access now and removes your personal identifiers. It cannot be undone."
        confirmLabel="Delete account"
        disabled={!password || pending}
        onConfirm={() => void run(() => deleteAccountAction(password))}
      />
    </div>
  );
}
