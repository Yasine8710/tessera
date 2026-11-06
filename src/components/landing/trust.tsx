import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { LinkButton } from "@/components/ui/button";
import { Reveal } from "@/components/ui/reveal";
import { ConsentDemo } from "./consent-demo";
import { Figure, Rule, SectionLabel, Words } from "./editorial";
import { wrap } from "./layout";

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
        <div className={`${wrap} py-[var(--space-section)]`}>
          <SectionLabel n="06">Trust</SectionLabel>
          <div className="mt-10 grid gap-12 lg:grid-cols-12 lg:items-start lg:gap-16">
            <div className="lg:col-span-5">
              <Words as="h2" className="display-lg" text="Privacy and security" />
              <Reveal delay={0.1}>
                <p className="lede mt-5 max-w-xl">
                  Built so sharing is the patient&apos;s decision. We describe what the software does; we do not claim certification or legal compliance. Operators must seek their own legal review.
                </p>
                <p className="mt-5 text-sm text-muted">
                  Read the full{" "}
                  <Link href="/privacy" className="font-medium text-accent underline underline-offset-2 hover:no-underline">
                    privacy notice
                  </Link>
                  .
                </p>
              </Reveal>
            </div>
            <Reveal delay={0.08} className="lg:col-span-7">
              <ConsentDemo />
            </Reveal>
          </div>

          <Figure
            name="waiting-room"
            sizes="(min-width: 1280px) 1200px, 100vw"
            focal="50% 55%"
            className="mt-14 aspect-[16/9] w-full sm:aspect-[21/9] lg:mt-20 lg:aspect-[24/9]"
          />

          <ul className="mt-14 grid md:grid-cols-2 md:gap-x-14 lg:mt-20">
            {SECURITY.map((s, i) => (
              <li key={s.title}>
                <Rule />
                <Reveal delay={0.03 * (i % 2)} className="group grid grid-cols-[2.5rem_1fr] gap-x-3 py-6">
                  <span className="pt-1 text-sm font-semibold tabular-nums text-muted transition-colors duration-300 group-hover:text-accent" aria-hidden>
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <div>
                    <h3 className="text-lg font-semibold tracking-tight">{s.title}</h3>
                    <p className="mt-1 text-ink2">{s.text}</p>
                  </div>
                </Reveal>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section id="free" className="border-b border-line">
        <div className={`${wrap} py-[var(--space-section)]`}>
          <SectionLabel n="07">Cost</SectionLabel>
          <div className="mt-10 grid gap-12 lg:grid-cols-12 lg:gap-16">
            <div className="lg:col-span-7 lg:pt-4">
              <Words as="h2" className="text-[clamp(2.4rem,6.4vw,5.5rem)] font-semibold leading-[1] tracking-[-0.03em]" text="Free for patients and staff." />
              <Reveal delay={0.08}>
                <p className="lede mt-6 max-w-xl">No subscriptions, no premium tiers, no ads and no data selling.</p>
                <p className="mt-6 max-w-xl text-ink2">
                  Tessera is self-hosted. Whoever runs this instance, the operator, pays for hosting, email delivery and the database. That cost is theirs to carry and is the only cost in the system; nothing is charged to users and nothing in your data is monetised to cover it.
                </p>
                <LinkButton href="/register" size="lg" className="group mt-8">
                  Get Started — Free
                  <ArrowRight className="size-4 transition-transform duration-200 group-hover:translate-x-1" aria-hidden />
                </LinkButton>
              </Reveal>
            </div>
            <Figure
              name="blossom"
              sizes="(min-width: 1024px) 33vw, 100vw"
              focal="50% 40%"
              className="aspect-[4/5] w-full max-w-md lg:col-span-5 lg:max-w-none"
            />
          </div>
        </div>
      </section>
    </>
  );
}
