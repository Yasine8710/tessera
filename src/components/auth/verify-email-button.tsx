"use client";

import { useState } from "react";
import { verifyEmailAction } from "@/app/actions/auth";
import { Alert } from "@/components/ui/card";
import { Button, LinkButton } from "@/components/ui/button";
import { useAction } from "@/components/ui/use-action";

/**
 * Verification is an explicit click rather than a side effect of loading the page, so mail
 * scanners and link previews that fetch URLs cannot consume the one-time token.
 */
export function VerifyEmailButton({ token }: { token: string }) {
  const { run, pending, error } = useAction();
  const [done, setDone] = useState(false);

  if (done) {
    return (
      <div className="space-y-4">
        <Alert tone="ok" title="Email verified">
          Thank you. Your email address is now confirmed.
        </Alert>
        <LinkButton href="/login">Continue to sign in</LinkButton>
      </div>
    );
  }
  return (
    <div className="space-y-4">
      {error && <Alert tone="danger">{error}</Alert>}
      <Button type="button" loading={pending} onClick={() => run(() => verifyEmailAction(token), "Email verified", () => setDone(true))}>
        Confirm my email address
      </Button>
    </div>
  );
}
