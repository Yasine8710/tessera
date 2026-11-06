import { LinkButton } from "@/components/ui/button";
import { Reveal } from "@/components/ui/reveal";
import { Figure, SectionLabel, Words } from "./editorial";
import { wrap } from "./layout";

/** Hairline rows. The dash that leads each row lengthens on hover. */
function Points({ items, className }: { items: string[]; className?: string }) {
  return (
    <ul className={className}>
      {items.map((t) => (
        <li key={t} className="group flex gap-4 border-t border-line py-4 last:border-b">
          <span className="mt-3 h-px w-4 shrink-0 bg-accent transition-[width] duration-300 ease-[var(--ease)] group-hover:w-8" aria-hidden />
          <span className="text-ink2 transition-colors group-hover:text-ink">{t}</span>
        </li>
      ))}
    </ul>
  );
}

export function Audiences() {
  return (
    <>
      <section id="patients" className="border-b border-line">
        <div className={`${wrap} py-[var(--space-section)]`}>
          <div className="grid gap-12 lg:grid-cols-12 lg:gap-16">
            <Figure
              name="walk-autumn"
              sizes="(min-width: 1024px) 40vw, 100vw"
              focal="50% 40%"
              className="aspect-[4/5] w-full max-w-md lg:col-span-5 lg:max-w-none"
            />
            <div className="lg:col-span-7">
              <SectionLabel n="03">For patients</SectionLabel>
              <Words as="h2" className="display-lg mt-8" text="Keep your day on track, share only what you choose." />
              <Reveal delay={0.06}>
                <Points
                  className="mt-8"
                  items={[
                    "See today's medications and routines in one place, in your own time zone.",
                    "Mark doses as taken or skipped, with an optional note.",
                    "Keep a health journal and record measurements such as blood pressure or weight.",
                    "Choose, per category, what each professional can see: journal, measurements, routines, medication adherence. Change it whenever you like.",
                    "Request appointments and message your connected care team. Requests stay requests until staff confirm them.",
                    "End a connection at any time.",
                  ]}
                />
                <LinkButton href="/register/patient" size="lg" className="mt-8">
                  Create a patient account
                </LinkButton>
              </Reveal>
            </div>
          </div>
        </div>
      </section>

      <section id="staff" className="border-b border-line bg-surface2">
        <div className={`${wrap} py-[var(--space-section)]`}>
          <div className="grid gap-12 lg:grid-cols-12 lg:gap-16">
            <div className="order-2 lg:order-1 lg:col-span-7">
              <SectionLabel n="04">For medical staff</SectionLabel>
              <Words as="h2" className="display-lg mt-8" text="A clearer picture between visits, within the limits patients set." />
              <div className="mt-10 grid gap-10 xl:grid-cols-2 xl:gap-8">
                <Reveal delay={0.05}>
                  <h3 className="text-lg font-semibold">What you get</h3>
                  <Points
                    className="mt-4"
                    items={[
                      "A patient list limited to people connected to you.",
                      "Self-reported adherence, routines, measurements and journal entries, only where consent was given.",
                      "Care plans and medication schedules with a recorded reason for every change.",
                      "Tasks, follow-up reminders, appointments and secure in-app messaging.",
                    ]}
                  />
                </Reveal>
                <Reveal delay={0.1}>
                  <h3 className="text-lg font-semibold">What to expect</h3>
                  <Points
                    className="mt-4"
                    items={[
                      "Staff accounts are verified by an administrator from your licence details before access is enabled.",
                      "Patient entries are self-reported and may be incomplete. They support, not replace, your clinical judgement.",
                      "Tessera does not diagnose or suggest doses.",
                    ]}
                  />
                  <LinkButton href="/register/professional" variant="secondary" size="lg" className="mt-8">
                    Register as a professional
                  </LinkButton>
                </Reveal>
              </div>
            </div>
            <Figure
              name="care-team"
              alt="Three healthcare professionals standing together in a clinic corridor."
              sizes="(min-width: 1024px) 40vw, 100vw"
              focal="50% 30%"
              className="order-1 aspect-[4/5] w-full max-w-md lg:order-2 lg:col-span-5 lg:max-w-none"
            />
          </div>
        </div>
      </section>
    </>
  );
}
