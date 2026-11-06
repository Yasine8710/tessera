import type { Metadata } from "next";
import { LinkButton } from "@/components/ui/button";
import { Logo } from "@/components/logo";

export const metadata: Metadata = { title: "Page not found" };

/** The logo's T with its last tile missing: a dashed outline where the page should be. */
function MissingTile() {
  return (
    <svg viewBox="0 0 64 64" className="anim-fade size-20" aria-hidden>
      <g fill="var(--c-border-strong)">
        <rect x="4" y="4" width="16" height="16" rx="2.5" />
        <rect x="24" y="4" width="16" height="16" rx="2.5" />
        <rect x="44" y="4" width="16" height="16" rx="2.5" />
        <rect x="24" y="24" width="16" height="16" rx="2.5" />
      </g>
      <rect x="24.75" y="44.75" width="14.5" height="14.5" rx="2.5" fill="none" stroke="var(--c-accent)" strokeWidth="1.5" strokeDasharray="3 3" />
    </svg>
  );
}

export default function NotFound() {
  return (
    <main id="main" className="mx-auto flex min-h-dvh max-w-xl flex-col justify-center px-4 sm:px-6">
      <div className="stagger">
        <Logo />
        <div className="mt-12">
          <MissingTile />
        </div>
        <p className="mt-6 text-sm font-medium text-muted">Error 404</p>
        <h1 className="mt-1 text-3xl font-semibold">We could not find that page</h1>
        <p className="mt-3 max-w-md text-ink2">The link may be mistyped or the page may have moved.</p>
        <div className="mt-8 flex flex-wrap gap-3">
          <LinkButton href="/" className="press">
            Go to the home page
          </LinkButton>
          <LinkButton href="/login" variant="secondary" className="press">
            Sign in
          </LinkButton>
        </div>
      </div>
    </main>
  );
}
