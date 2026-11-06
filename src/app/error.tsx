"use client";

import { Button, LinkButton } from "@/components/ui/button";

export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main id="main" className="mx-auto flex min-h-dvh max-w-xl flex-col justify-center px-4 sm:px-6">
      <div className="stagger">
        <svg viewBox="0 0 64 64" className="anim-fade size-20" aria-hidden>
          <g fill="var(--c-border-strong)">
            <rect x="4" y="4" width="16" height="16" rx="2.5" />
            <rect x="24" y="4" width="16" height="16" rx="2.5" />
            <rect x="44" y="4" width="16" height="16" rx="2.5" />
            <rect x="24" y="24" width="16" height="16" rx="2.5" />
          </g>
          <rect x="24" y="44" width="16" height="16" rx="2.5" fill="var(--c-danger)" />
        </svg>
        <h1 className="mt-6 text-3xl font-semibold">Something went wrong</h1>
        <p role="alert" className="mt-3 max-w-md text-ink2">
          An unexpected error occurred. Nothing you entered has been lost on the server. If this keeps happening, contact the operator of this service.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Button className="press" onClick={() => reset()}>
            Try again
          </Button>
          <LinkButton href="/" variant="secondary" className="press">
            Go to the home page
          </LinkButton>
        </div>
      </div>
    </main>
  );
}
