import Link from "next/link";
import { FileClock, KeyRound, Lock, Share2, UserCheck, Ban } from "lucide-react";
import { Card } from "@/components/ui/card";
import { LinkButton } from "@/components/ui/button";
import { Reveal } from "@/components/ui/reveal";

const SECURITY = [
  { icon: Share2, title: "Consent per data category", text: "Patients switch journal, measurements, routines and medication adherence on or off for each professional." },
  { icon: UserCheck, title: "Relationship-gated access", text: "A professional can only reach a patient after an active care relationship exists. Every request is checked on the server." },
  { icon: FileClock, title: "Audit trail", text: "Sign-ins, consent changes, invitations and record access are logged." },
  { icon: Lock, title: "Hashed session tokens", text: "Only a hash of each session token is stored, and the cookie is HTTP-only." },
  { icon: KeyRound, title: "scrypt password hashing", text: "Passwords are stored as salted scrypt hashes, never in plain text." },
  { icon: Ban, title: "No selling of data", text: "No advertising, no data brokers, no resale." },
];

export function Trust() {
  return (
    <>
      <section id="security" className="border-b border-line bg-surface2">
        <div className="mx-auto max-w-6xl px-4 py-[var(--space-section)] sm:px-6">
          <Reveal>
            <h2 className="text-3xl font-semibold sm:text-4xl">Privacy and security</h2>
            <p className="mt-3 max-w-2xl text-lg text-ink2">
              Built so sharing is the patient&apos;s decision. We describe what the software does; we do not claim certification or legal compliance. Operators must seek their own legal review.
            </p>
          </Reveal>
          <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {SECURITY.map((s, i) => (
              <li key={s.title}>
                <Reveal delay={(i % 3) * 0.05} className="h-full">
                  <Card className="h-full p-5">
                    <s.icon className="size-5 text-accent" aria-hidden />
                    <h3 className="mt-3 font-semibold">{s.title}</h3>
                    <p className="mt-1 text-sm text-ink2">{s.text}</p>
                  </Card>
                </Reveal>
              </li>
            ))}
          </ul>
          <p className="mt-6 text-sm text-muted">
            Read the full <Link href="/privacy" className="text-accent underline">privacy notice</Link>.
          </p>
        </div>
      </section>

      <section id="free" className="border-b border-line">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 py-[var(--space-section)] sm:px-6 lg:grid-cols-[1fr_1.1fr] lg:items-center">
          <Reveal>
            <h2 className="text-3xl font-semibold sm:text-4xl">Free for patients and staff.</h2>
            <p className="mt-3 text-lg text-ink2">
              No subscriptions, no premium tiers, no ads and no data selling.
            </p>
            <LinkButton href="/register" className="mt-6">
              Get Started — Free
            </LinkButton>
          </Reveal>
          <Reveal delay={0.08}>
            <p className="text-ink2">
              Tessera is self-hosted. Whoever runs this instance, the operator, pays for hosting, email delivery and the database. That cost is theirs to carry and is the only cost in the system; nothing is charged to users and nothing in your data is monetised to cover it.
            </p>
          </Reveal>
        </div>
      </section>
    </>
  );
}
