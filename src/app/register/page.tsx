import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, Stethoscope, UserRound } from "lucide-react";
import { AuthShell } from "@/components/auth/auth-shell";
import { inlineLink } from "@/components/auth/link-styles";
import { getSession, homeFor } from "@/server/session";

export const metadata: Metadata = { title: "Create an account" };

const OPTIONS = [
  {
    href: "/register/patient",
    icon: UserRound,
    title: "I am a patient",
    text: "Track your medications and routines, keep a health journal, and choose what to share with your care team.",
  },
  {
    href: "/register/professional",
    icon: Stethoscope,
    title: "I am a medical professional",
    text: "Coordinate follow-up for patients who connect with you. Requires administrator verification of your licence details.",
  },
];

export default async function RegisterPage() {
  const session = await getSession();
  if (session) redirect(homeFor(session.role));
  return (
    <AuthShell
      title="Create your account"
      description="Tessera is free for everyone. Choose the account type that fits you."
      wide
      footer={
        <p>
          Already have an account?{" "}
          <Link href="/login" className={inlineLink}>
            Sign in
          </Link>
        </p>
      }
    >
      <ul className="stagger space-y-3">
        {OPTIONS.map((o) => (
          <li key={o.href}>
            <Link
              href={o.href}
              className="hover-lift press group flex items-start gap-4 rounded-lg border border-line bg-surface p-5 shadow-sm hover:border-accent"
            >
              <span className="grid size-10 shrink-0 place-items-center rounded-md bg-accent-soft text-accent transition-colors duration-200 group-hover:bg-accent group-hover:text-onaccent">
                <o.icon className="size-5" aria-hidden />
              </span>
              <span className="flex-1">
                <span className="block font-semibold">{o.title}</span>
                <span className="mt-1 block text-sm text-muted">{o.text}</span>
              </span>
              <ArrowRight className="mt-1 size-4 shrink-0 text-muted transition-transform duration-200 group-hover:translate-x-1 group-hover:text-accent" aria-hidden />
            </Link>
          </li>
        ))}
      </ul>
    </AuthShell>
  );
}
