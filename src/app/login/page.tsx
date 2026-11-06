import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthShell } from "@/components/auth/auth-shell";
import { inlineLink } from "@/components/auth/link-styles";
import { LoginForm } from "@/components/auth/login-form";
import { isDesktop } from "@/server/desktop";
import { demoAvailable } from "@/server/services/demo";
import { adminExists } from "@/server/services/auth";
import { getSession, homeFor } from "@/server/session";

export const metadata: Metadata = { title: "Sign in" };

export default async function LoginPage() {
  if (isDesktop() && !(await adminExists())) redirect("/setup");
  const session = await getSession();
  if (session) redirect(homeFor(session.role));
  const demo = await demoAvailable();
  return (
    <AuthShell
      title="Sign in"
      photo="hero-consultation"
      focal="55% 40%"
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
