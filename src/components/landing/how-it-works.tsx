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
      <div className="mx-auto max-w-6xl px-4 py-[var(--space-section)] sm:px-6">
        <Reveal>
          <h2 className="text-3xl font-semibold sm:text-4xl">How it works</h2>
          <p className="mt-3 max-w-2xl text-lg text-ink2">Five steps from sign-up to shared follow-up. Nothing is shared until the patient says so.</p>
        </Reveal>
        <ol className="mt-10 grid gap-x-10 gap-y-8 md:grid-cols-2">
          {STEPS.map((s, i) => (
            <li key={s.title} className={i === 4 ? "md:col-span-2" : undefined}>
              <Reveal delay={i * 0.05} className="flex gap-4">
                <span className="grid size-9 shrink-0 place-items-center rounded-full border border-accent text-sm font-semibold text-accent">{i + 1}</span>
                <div>
                  <h3 className="text-lg font-semibold">{s.title}</h3>
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
