import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthShell } from "@/components/auth/auth-shell";
import { inlineLink } from "@/components/auth/link-styles";
import { LoginForm } from "@/components/auth/login-form";
import { isDesktop } from "@/server/desktop";
import { adminExists } from "@/server/services/auth";
import { getSession, homeFor } from "@/server/session";

export const metadata: Metadata = { title: "Sign in" };

export default async function LoginPage() {
  if (isDesktop() && !(await adminExists())) redirect("/setup");
  const session = await getSession();
  if (session) redirect(homeFor(session.role));
  const demo = process.env.DEMO_MODE === "true";
  return (
    <AuthShell
      title="Sign in"
      description="Welcome back. Sign in to continue."
      footer={
        <p>
          New to Tessera?{" "}
          <Link href="/register" className={inlineLink}>
            Create an account
          </Link>
        </p>
      }
    >
      <LoginForm demo={demo} />
    </AuthShell>
  );
}
