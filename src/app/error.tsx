"use client";

import { TriangleAlert } from "lucide-react";
import { Button, LinkButton } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/card";

export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main id="main" className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center px-4 text-center">
      <EmptyState
        icon={TriangleAlert}
        title="Something went wrong"
        action={
          <div className="flex flex-wrap justify-center gap-2">
            <Button onClick={() => reset()}>Try again</Button>
            <LinkButton href="/" variant="secondary">
              Go to the home page
            </LinkButton>
          </div>
        }
      >
        An unexpected error occurred. Nothing you entered has been lost on the server. If this keeps happening, contact the operator of this service.
      </EmptyState>
    </main>
  );
}
