import { Check } from "lucide-react";
import { LinkButton } from "@/components/ui/button";
import { Reveal } from "@/components/ui/reveal";

function Points({ items }: { items: string[] }) {
  return (
    <ul className="mt-6 space-y-3">
      {items.map((t) => (
        <li key={t} className="flex gap-3">
          <Check className="mt-1 size-4 shrink-0 text-accent" aria-hidden />
          <span className="text-ink2">{t}</span>
        </li>
      ))}
    </ul>
  );
}

export function Audiences() {
  return (
    <>
      <section id="patients" className="border-b border-line">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-[var(--space-section)] sm:px-6 lg:grid-cols-[1fr_1.2fr]">
          <Reveal>
            <p className="text-sm font-semibold uppercase tracking-wide text-accent-hover">For patients</p>
            <h2 className="mt-2 text-3xl font-semibold sm:text-4xl">Keep your day on track, share only what you choose.</h2>
            <LinkButton href="/register/patient" className="mt-8">
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

      <section id="staff" className="border-b border-line bg-nav text-white">
        <div className="mx-auto max-w-6xl px-4 py-[var(--space-section)] sm:px-6">
          <Reveal>
            <p className="text-sm font-semibold uppercase tracking-wide text-[#5fd0c8]">For medical staff</p>
            <h2 className="mt-2 max-w-3xl text-3xl font-semibold sm:text-4xl">A clearer picture between visits, within the limits patients set.</h2>
          </Reveal>
          <div className="mt-10 grid gap-8 md:grid-cols-2">
            <Reveal delay={0.05}>
              <h3 className="text-lg font-semibold">What you get</h3>
              <ul className="mt-3 space-y-2 text-white/80">
                <li>A patient list limited to people connected to you.</li>
                <li>Self-reported adherence, routines, measurements and journal entries, only where consent was given.</li>
                <li>Care plans and medication schedules with a recorded reason for every change.</li>
                <li>Tasks, follow-up reminders, appointments and secure in-app messaging.</li>
              </ul>
            </Reveal>
            <Reveal delay={0.1}>
              <h3 className="text-lg font-semibold">What to expect</h3>
              <ul className="mt-3 space-y-2 text-white/80">
                <li>Staff accounts are verified by an administrator from your licence details before access is enabled.</li>
                <li>Patient entries are self-reported and may be incomplete. They support, not replace, your clinical judgement.</li>
                <li>Tessera does not diagnose or suggest doses.</li>
              </ul>
              <LinkButton href="/register/professional" variant="secondary" className="mt-6">
                Register as a professional
              </LinkButton>
            </Reveal>
          </div>
        </div>
      </section>
    </>
  );
}
