import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { LogOut } from "lucide-react";
import { logoutAction } from "@/app/actions/auth";
import { AuthShell } from "@/components/auth/auth-shell";
import { Alert } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getSession, homeFor } from "@/server/session";

export const metadata: Metadata = { title: "Awaiting approval", robots: { index: false } };

export default async function PendingApprovalPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role !== "PROFESSIONAL") redirect(homeFor(session.role));
  if (session.professionalId) redirect("/staff");

  return (
    <AuthShell title="Your account is awaiting approval" description={<>Signed in as {session.email}.</>}>
      <div className="space-y-5">
        <Alert tone="warn" title="Staff access is not active yet">
          An administrator needs to verify your licence details before you can see patients or send invitations. This is a manual review and can take some time.
        </Alert>
        <ul className="list-disc space-y-1.5 pl-5 text-sm text-ink2">
          <li>You will be able to use staff features as soon as your account is approved. Refresh this page or sign in again to check.</li>
          <li>If your account is declined or suspended, you will not gain access. Contact the service operator for details.</li>
          <li>No patient data is available to you while you wait.</li>
        </ul>
        <form action={logoutAction}>
          <Button type="submit" variant="secondary">
            <LogOut className="size-4" aria-hidden />
            Sign out
          </Button>
        </form>
      </div>
    </AuthShell>
  );
}
