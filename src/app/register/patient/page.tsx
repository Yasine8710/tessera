import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthShell } from "@/components/auth/auth-shell";
import { inlineLink } from "@/components/auth/link-styles";
import { RegisterPatientForm } from "@/components/auth/register-patient-form";
import { getSession, homeFor } from "@/server/session";

export const metadata: Metadata = { title: "Create a patient account" };

export default async function RegisterPatientPage() {
  const session = await getSession();
  if (session) redirect(homeFor(session.role));
  return (
    <AuthShell
      title="Create a patient account"
      description="Free to use. Nothing is shared with anyone unless you choose to."
      wide
      footer={
        <p>
          Medical professional?{" "}
          <Link href="/register/professional" className={inlineLink}>
            Register here
          </Link>
          . Already registered?{" "}
          <Link href="/login" className={inlineLink}>
            Sign in
          </Link>
        </p>
      }
    >
      <RegisterPatientForm />
    </AuthShell>
  );
}
