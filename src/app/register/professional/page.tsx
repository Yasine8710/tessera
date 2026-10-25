import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthShell } from "@/components/auth/auth-shell";
import { RegisterProfessionalForm } from "@/components/auth/register-professional-form";
import { getSession, homeFor } from "@/server/session";

export const metadata: Metadata = { title: "Register as a medical professional" };

export default async function RegisterProfessionalPage() {
  const session = await getSession();
  if (session) redirect(homeFor(session.role));
  return (
    <AuthShell
      title="Register as a medical professional"
      description="Your licence details are reviewed by an administrator before you can connect with patients."
      wide
      footer={
        <p>
          Patient?{" "}
          <Link href="/register/patient" className="font-medium text-accent hover:underline">
            Create a patient account
          </Link>
          . Already registered?{" "}
          <Link href="/login" className="font-medium text-accent hover:underline">
            Sign in
          </Link>
        </p>
      }
    >
      <RegisterProfessionalForm />
    </AuthShell>
  );
}
