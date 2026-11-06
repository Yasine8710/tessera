import { Reveal } from "@/components/ui/reveal";

const STEPS = [
  { title: "Patients create an account", text: "Free, with an email address and password. Date of birth is optional." },
  { title: "Connect with an authorized professional", text: "Accept an invitation from a verified professional or care organisation, or request a connection yourself. You choose what to share." },
  { title: "The care team creates or confirms treatment plans", text: "Professionals set up medication schedules and care plans. Patients see them as the plan on record." },
  { title: "Patients record medication intake and routines", text: "Mark doses taken or skipped, tick off routines, and add journal entries and measurements. Entries are self-reported." },
  { title: "Professionals review progress and organise follow-ups", text: "Within the categories a patient has allowed, staff review trends, message the patient, and request or schedule appointments." },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="border-b border-line bg-surface2">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-[var(--space-section)] sm:px-6 lg:grid-cols-[1fr_1.7fr] lg:gap-16">
        <Reveal className="lg:sticky lg:top-28 lg:self-start">
          <h2 className="text-3xl font-semibold sm:text-4xl">How it works</h2>
          <p className="mt-3 max-w-md text-lg text-ink2">Five steps from sign-up to shared follow-up. Nothing is shared until the patient says so.</p>
        </Reveal>
        <ol className="border-t border-line2">
          {STEPS.map((s, i) => (
            <li key={s.title} className="border-b border-line">
              <Reveal delay={i * 0.04} className="group grid grid-cols-[2.75rem_1fr] gap-x-4 py-6 transition-colors duration-200 hover:bg-surface sm:grid-cols-[3.5rem_1fr] sm:px-3">
                <span className="text-2xl font-semibold tabular-nums text-muted transition-colors duration-300 group-hover:text-accent" aria-hidden>
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div>
                  <h3 className="text-lg font-semibold">
                    <span className="sr-only">Step {i + 1}: </span>
                    {s.title}
                  </h3>
                  <p className="mt-1 max-w-xl text-ink2">{s.text}</p>
                </div>
              </Reveal>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
