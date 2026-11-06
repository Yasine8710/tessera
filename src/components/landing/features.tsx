import { Reveal } from "@/components/ui/reveal";
import { Figure, Rule, SectionLabel, Words } from "./editorial";
import { wrap } from "./layout";

const FEATURES = [
  { title: "Medication tracking", text: "Scheduled doses with taken or skipped status, from the plan your care team sets." },
  { title: "Daily routines", text: "Hydration, activity, sleep and wellness routines you can tick off." },
  { title: "Appointments", text: "Request a time with a connected professional. Staff confirm or reschedule." },
  { title: "Patient monitoring", text: "Staff see only the shared data categories for patients connected to them." },
  { title: "Progress reporting", text: "Adherence and measurement trends over time, labelled as self-reported." },
  { title: "Communication", text: "Messages between a patient and their connected professionals. Not for emergencies." },
  { title: "Reminders", text: "In-app notifications and email reminders where the operator has set up email." },
];

export function Features() {
  return (
    <section id="features" className="border-b border-line">
      <div className={`${wrap} py-[var(--space-section)]`}>
        <SectionLabel n="05">Features</SectionLabel>
        <div className="mt-10 grid gap-12 lg:grid-cols-12 lg:gap-16">
          <div className="lg:sticky lg:top-28 lg:col-span-4 lg:self-start">
            <Words as="h2" className="display-lg" text="What Tessera does" />
            <Reveal delay={0.1}>
              <p className="lede mt-4 max-w-md">Seven practical tools, no extras.</p>
            </Reveal>
            <Figure
              name="clinician-tablet"
              sizes="(min-width: 1024px) 33vw, 100vw"
              focal="55% 50%"
              className="mt-8 aspect-[4/3] w-full max-w-md lg:max-w-none"
            />
          </div>
          <ul className="lg:col-span-8">
            {FEATURES.map((f, i) => (
              <li key={f.title}>
                <Rule />
                <Reveal delay={0.03 * (i % 3)} className="group grid gap-x-6 gap-y-1 py-6 sm:grid-cols-[3rem_15rem_1fr] sm:py-7">
                  <span className="text-sm font-semibold tabular-nums text-muted transition-colors duration-300 group-hover:text-accent" aria-hidden>
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <h3 className="text-xl font-semibold tracking-tight transition-transform duration-300 ease-[var(--ease)] group-hover:translate-x-1">{f.title}</h3>
                  <p className="text-ink2">{f.text}</p>
                </Reveal>
              </li>
            ))}
            <li aria-hidden>
              <Rule />
            </li>
          </ul>
        </div>
      </div>
    </section>
  );
}
