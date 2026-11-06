import { Reveal } from "@/components/ui/reveal";
import { Figure, Rule, SectionLabel, Words } from "./editorial";
import { wrap } from "./layout";

const STEPS = [
  { title: "Patients create an account", text: "Free, with an email address and password. Date of birth is optional." },
  { title: "Connect with an authorized professional", text: "Accept an invitation from a verified professional or care organisation, or request a connection yourself. You choose what to share." },
  { title: "The care team creates or confirms treatment plans", text: "Professionals set up medication schedules and care plans. Patients see them as the plan on record." },
  { title: "Patients record medication intake and routines", text: "Mark doses taken or skipped, tick off routines, and add journal entries and measurements. Entries are self-reported." },
  { title: "Professionals review progress and organise follow-ups", text: "Within the categories a patient has allowed, staff review trends, message the patient, and request or schedule appointments." },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="border-b border-line">
      <div className={`${wrap} py-[var(--space-section)]`}>
        <SectionLabel n="01">How it works</SectionLabel>
        <div className="mt-10 grid gap-12 lg:grid-cols-12 lg:gap-16">
          <div className="lg:col-span-5">
            <Words as="h2" className="display-lg" text="Five steps from sign-up to shared follow-up." />
            <Reveal delay={0.1}>
              <p className="lede mt-5 max-w-md">Nothing is shared until the patient says so.</p>
            </Reveal>
            <Figure
              name="pill-organizer"
              sizes="(min-width: 1024px) 40vw, 100vw"
              focal="50% 45%"
              className="mt-10 aspect-[4/5] w-full max-w-md lg:max-w-none"
            />
          </div>
          <ol className="lg:col-span-7">
            {STEPS.map((s, i) => (
              <li key={s.title}>
                <Rule className="bg-line2" />
                <Reveal delay={0.03} className="group grid grid-cols-[3.75rem_1fr] gap-x-4 py-7 sm:grid-cols-[5.5rem_1fr] sm:py-9">
                  <span className="text-4xl font-light leading-none tabular-nums text-muted transition-colors duration-300 group-hover:text-accent sm:text-6xl" aria-hidden>
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <div>
                    <h3 className="text-xl font-semibold tracking-tight sm:text-2xl">
                      <span className="sr-only">Step {i + 1}: </span>
                      {s.title}
                    </h3>
                    <p className="mt-2 max-w-xl text-ink2">{s.text}</p>
                  </div>
                </Reveal>
              </li>
            ))}
            <li aria-hidden>
              <Rule />
            </li>
          </ol>
        </div>
      </div>
    </section>
  );
}
