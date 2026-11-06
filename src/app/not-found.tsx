import type { Metadata } from "next";
import { LinkButton } from "@/components/ui/button";
import { StatusPage } from "@/components/landing/status-page";

export const metadata: Metadata = { title: "Page not found" };

export default function NotFound() {
  return (
    <StatusPage code={404} eyebrow="Error 404" title="We could not find that page" photo="walk-coat" focal="50% 40%">
      <p>The link may be mistyped or the page may have moved.</p>
      <div className="mt-8 flex flex-wrap gap-3">
        <LinkButton href="/" size="lg">
          Go to the home page
        </LinkButton>
        <LinkButton href="/login" variant="secondary" size="lg">
          Sign in
        </LinkButton>
      </div>
    </StatusPage>
  );
}
