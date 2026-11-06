"use client";

import { useState } from "react";
import { issueResetLinkAction } from "@/app/actions/admin";
import { Button } from "@/components/ui/button";
import { useAction } from "@/components/ui/use-action";

/** Desktop has no email: the administrator copies a one-time link and hands it to the user. */
export function ResetLinkButton({ userId, name }: { userId: string; name: string }) {
  const { run, pending, error } = useAction();
  const [link, setLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  async function issue() {
    await run(
      () => issueResetLinkAction(userId),
      undefined,
      (d) => setLink(`${window.location.origin}${d.path}`),
    );
  }

  return (
    <div className="space-y-1">
      <Button variant="ghost" size="sm" loading={pending} onClick={() => void issue()} aria-label={`Reset password for ${name}`}>
        Reset password
      </Button>
      {link && (
        <div className="max-w-64 text-left text-xs">
          <p className="text-muted">One-time link, valid 60 minutes. Open it in CareSync on this PC.</p>
          <code className="block break-all rounded bg-surface2 p-1.5">{link}</code>
          <Button
            variant="secondary"
            size="sm"
            className="mt-1"
            onClick={() => void navigator.clipboard.writeText(link).then(() => setCopied(true))}
          >
            {copied ? "Copied" : "Copy link"}
          </Button>
        </div>
      )}
      {error && <p role="alert" className="max-w-48 text-xs text-danger">{error}</p>}
    </div>
  );
}
