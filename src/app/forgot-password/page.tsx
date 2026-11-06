import type { Metadata } from "next";
import Link from "next/link";
import { isDesktop } from "@/server/desktop";
import { AuthShell } from "@/components/auth/auth-shell";
import { inlineLink } from "@/components/auth/link-styles";
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";

export const metadata: Metadata = { title: "Reset your password" };

// Desktop vs web behaviour is decided per request from the environment, so never prerender.
export const dynamic = "force-dynamic";

export default function ForgotPasswordPage() {
  if (isDesktop()) {
    return (
      <AuthShell
        title="Forgot your password?"
        description="Tessera on this computer has no email. Ask your administrator to create a one-time reset link for you (Administration, Users, Reset password)."
        footer={
          <Link href="/login" className={inlineLink}>
            Back to sign in
          </Link>
        }
      >
        <p className="text-sm text-muted">Administrators: use Help, Reset administrator password in the app menu.</p>
      </AuthShell>
    );
  }
  return (
    <AuthShell
      title="Reset your password"
      description="Enter the email you registered with. If an account exists, we will send a link to choose a new password."
      footer={
        <Link href="/login" className={inlineLink}>
          Back to sign in
        </Link>
      }
    >
      <ForgotPasswordForm />
    </AuthShell>
  );
}
