import { LinkButton } from "@/components/ui/button";
import { Reveal } from "@/components/ui/reveal";

/** The list marker is a small tile, echoing the logo. */
function Points({ items, className }: { items: string[]; className?: string }) {
  return (
    <ul className={className}>
      {items.map((t) => (
        <li key={t} className="group flex gap-3.5 border-b border-line py-3.5 first:border-t">
          <span className="mt-2 size-1.5 shrink-0 rounded-[1px] bg-accent transition-transform duration-200 group-hover:scale-150" aria-hidden />
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
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-[var(--space-section)] sm:px-6 lg:grid-cols-[1fr_1.4fr] lg:gap-16">
          <Reveal>
            <p className="text-sm font-medium text-accent">For patients</p>
            <h2 className="mt-2 text-3xl font-semibold sm:text-4xl">Keep your day on track, share only what you choose.</h2>
            <LinkButton href="/register/patient" className="press mt-8">
              Create a patient account
            </LinkButton>
          </Reveal>
          <Reveal delay={0.08}>
            <Points
              items={[
                "See today's medications and routines in one place, in your own time zone.",
                "Mark doses as taken or skipped, with an optional note.",
                "Keep a health journal and record measurements such as blood pressure or weight.",
                "Choose, per category, what each professional can see: journal, measurements, routines, medication adherence. Change it whenever you like.",
                "Request appointments and message your connected care team. Requests stay requests until staff confirm them.",
                "End a connection at any time.",
              ]}
            />
          </Reveal>
        </div>
      </section>

      <section id="staff" className="border-b border-line bg-surface2">
        <div className="mx-auto max-w-6xl px-4 py-[var(--space-section)] sm:px-6">
          <Reveal>
            <p className="text-sm font-medium text-accent">For medical staff</p>
            <h2 className="mt-2 max-w-3xl text-3xl font-semibold sm:text-4xl">A clearer picture between visits, within the limits patients set.</h2>
          </Reveal>
          <div className="mt-10 grid gap-x-16 gap-y-10 md:grid-cols-2">
            <Reveal delay={0.05}>
              <h3 className="text-lg font-semibold">What you get</h3>
              <Points
                className="mt-3"
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
                className="mt-3"
                items={[
                  "Staff accounts are verified by an administrator from your licence details before access is enabled.",
                  "Patient entries are self-reported and may be incomplete. They support, not replace, your clinical judgement.",
                  "Tessera does not diagnose or suggest doses.",
                ]}
              />
              <LinkButton href="/register/professional" variant="secondary" className="press mt-6">
                Register as a professional
              </LinkButton>
            </Reveal>
          </div>
        </div>
      </section>
    </>
  );
}
