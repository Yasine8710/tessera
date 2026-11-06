import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { AuthShell } from "@/components/auth/auth-shell";
import { inlineLink } from "@/components/auth/link-styles";
import { Photo } from "@/components/ui/photo";
import { getSession, homeFor } from "@/server/session";

export const metadata: Metadata = { title: "Create an account" };

const OPTIONS = [
  {
    href: "/register/patient",
    photo: "walk-autumn",
    focal: "50% 45%",
    n: "01",
    title: "I am a patient",
    text: "Track your medications and routines, keep a health journal, and choose what to share with your care team.",
  },
  {
    href: "/register/professional",
    photo: "clinician-portrait",
    focal: "50% 30%",
    n: "02",
    title: "I am a medical professional",
    text: "Coordinate follow-up for patients who connect with you. Requires administrator verification of your licence details.",
  },
] as const;

export default async function RegisterPage() {
  const session = await getSession();
  if (session) redirect(homeFor(session.role));
  return (
    <AuthShell
      title="Create your account"
      description="Tessera is free for everyone. Choose the account type that fits you."
      wide
      photo="consult-smile"
      focal="50% 35%"
      footer={
        <p>
          Already have an account?{" "}
          <Link href="/login" className={inlineLink}>
            Sign in
          </Link>
        </p>
      }
    >
      <ul className="stagger space-y-4">
        {OPTIONS.map((o) => (
          <li key={o.href}>
            <Link
              href={o.href}
              className="press group grid grid-cols-[6.5rem_1fr_auto] items-stretch gap-5 border border-line bg-surface transition-colors duration-200 hover:border-accent sm:grid-cols-[9rem_1fr_auto]"
            >
              <Photo name={o.photo} focal={o.focal} sizes="144px" className="min-h-28" />
              <span className="py-4">
                <span className="block text-xs font-semibold tabular-nums text-muted">{o.n}</span>
                <span className="mt-1 block text-lg font-semibold tracking-tight">{o.title}</span>
                <span className="mt-1.5 block text-sm text-muted">{o.text}</span>
              </span>
              <ArrowRight className="mr-4 mt-5 size-4 shrink-0 text-muted transition-transform duration-200 group-hover:translate-x-1 group-hover:text-accent" aria-hidden />
            </Link>
          </li>
        ))}
      </ul>
    </AuthShell>
  );
}
