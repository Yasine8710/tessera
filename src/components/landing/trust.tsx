import Link from "next/link";
import { LinkButton } from "@/components/ui/button";
import { Reveal } from "@/components/ui/reveal";
import { ConsentDemo } from "./consent-demo";

const SECURITY = [
  { title: "Consent per data category", text: "Patients switch journal, measurements, routines and medication adherence on or off for each professional." },
  { title: "Relationship-gated access", text: "A professional can only reach a patient after an active care relationship exists. Every request is checked on the server." },
  { title: "Audit trail", text: "Sign-ins, consent changes, invitations and record access are logged." },
  { title: "Hashed session tokens", text: "Only a hash of each session token is stored, and the cookie is HTTP-only." },
  { title: "scrypt password hashing", text: "Passwords are stored as salted scrypt hashes, never in plain text." },
  { title: "No selling of data", text: "No advertising, no data brokers, no resale." },
];

export function Trust() {
  return (
    <>
      <section id="security" className="border-b border-line bg-surface2">
        <div className="mx-auto max-w-6xl px-4 py-[var(--space-section)] sm:px-6">
          <div className="grid gap-10 lg:grid-cols-[1fr_1.1fr] lg:items-start lg:gap-16">
            <Reveal>
              <h2 className="text-3xl font-semibold sm:text-4xl">Privacy and security</h2>
              <p className="mt-3 max-w-xl text-lg text-ink2">
                Built so sharing is the patient&apos;s decision. We describe what the software does; we do not claim certification or legal compliance. Operators must seek their own legal review.
              </p>
              <p className="mt-4 text-sm text-muted">
                Read the full{" "}
                <Link href="/privacy" className="font-medium text-accent underline underline-offset-2 hover:no-underline">
                  privacy notice
                </Link>
                .
              </p>
            </Reveal>
            <Reveal delay={0.08}>
              <ConsentDemo />
            </Reveal>
          </div>
          <ul className="mt-12 grid border-t border-line2 md:grid-cols-2 md:gap-x-12">
            {SECURITY.map((s, i) => (
              <li key={s.title} className="border-b border-line">
                <Reveal delay={0.03 * (i % 2)} className="group py-5">
                  <h3 className="flex items-center gap-3 font-semibold">
                    <span className="size-1.5 shrink-0 rounded-[1px] bg-accent transition-transform duration-200 group-hover:scale-150" aria-hidden />
                    {s.title}
                  </h3>
                  <p className="mt-1 pl-[1.125rem] text-ink2">{s.text}</p>
                </Reveal>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section id="free" className="border-b border-line">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 py-[var(--space-section)] sm:px-6 lg:grid-cols-[1fr_1.4fr] lg:gap-16">
          <Reveal>
            <h2 className="text-3xl font-semibold sm:text-4xl">Free for patients and staff.</h2>
            <p className="mt-3 text-lg text-ink2">No subscriptions, no premium tiers, no ads and no data selling.</p>
            <LinkButton href="/register" className="press mt-6">
              Get Started — Free
            </LinkButton>
          </Reveal>
          <Reveal delay={0.08}>
            <p className="max-w-2xl text-ink2">
              Tessera is self-hosted. Whoever runs this instance, the operator, pays for hosting, email delivery and the database. That cost is theirs to carry and is the only cost in the system; nothing is charged to users and nothing in your data is monetised to cover it.
            </p>
          </Reveal>
        </div>
      </section>
    </>
  );
}
