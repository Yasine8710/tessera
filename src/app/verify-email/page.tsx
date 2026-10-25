import type { Metadata } from "next";
import { AuthShell } from "@/components/auth/auth-shell";
import { VerifyEmailButton } from "@/components/auth/verify-email-button";
import { Alert } from "@/components/ui/card";
import { LinkButton } from "@/components/ui/button";

export const metadata: Metadata = { title: "Verify your email", robots: { index: false } };

export default async function VerifyEmailPage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const { token } = await searchParams;
  return (
    <AuthShell title="Verify your email" description="Confirm that this address belongs to you.">
      {token ? (
        <VerifyEmailButton token={token} />
      ) : (
        <div className="space-y-4">
          <Alert tone="danger" title="This link is incomplete">
            The verification link is missing its token. Open the link from your email again, or sign in to request a new one.
          </Alert>
          <LinkButton href="/login">Sign in</LinkButton>
        </div>
      )}
    </AuthShell>
  );
}
