"use client";

import { Button, LinkButton } from "@/components/ui/button";
import { StatusPage } from "@/components/landing/status-page";

export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <StatusPage eyebrow="Unexpected error" title="Something went wrong" alert photo="waiting-room" focal="50% 50%">
      <p>An unexpected error occurred. Nothing you entered has been lost on the server. If this keeps happening, contact the operator of this service.</p>
      <div className="mt-8 flex flex-wrap gap-3">
        <Button size="lg" onClick={() => reset()}>
          Try again
        </Button>
        <LinkButton href="/" variant="secondary" size="lg">
          Go to the home page
        </LinkButton>
      </div>
    </StatusPage>
  );
}
