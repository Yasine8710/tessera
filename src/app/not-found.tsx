import type { Metadata } from "next";
import { Compass } from "lucide-react";
import { LinkButton } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/card";
import { Logo } from "@/components/logo";

export const metadata: Metadata = { title: "Page not found" };

export default function NotFound() {
  return (
    <main id="main" className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center px-4 text-center">
      <Logo />
      <EmptyState
        icon={Compass}
        title="We could not find that page"
        action={
          <div className="flex flex-wrap justify-center gap-2">
            <LinkButton href="/">Go to the home page</LinkButton>
            <LinkButton href="/login" variant="secondary">
              Sign in
            </LinkButton>
          </div>
        }
      >
        The link may be mistyped or the page may have moved.
      </EmptyState>
    </main>
  );
}
