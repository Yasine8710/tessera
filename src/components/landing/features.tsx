import { Activity, BarChart3, BellRing, CalendarCheck, MessagesSquare, Pill, Repeat } from "lucide-react";
import { Reveal } from "@/components/ui/reveal";

const FEATURES = [
  { icon: Pill, title: "Medication tracking", text: "Scheduled doses with taken or skipped status, from the plan your care team sets." },
  { icon: Repeat, title: "Daily routines", text: "Hydration, activity, sleep and wellness routines you can tick off." },
  { icon: CalendarCheck, title: "Appointments", text: "Request a time with a connected professional. Staff confirm or reschedule." },
  { icon: Activity, title: "Patient monitoring", text: "Staff see only the shared data categories for patients connected to them." },
  { icon: BarChart3, title: "Progress reporting", text: "Adherence and measurement trends over time, labelled as self-reported." },
  { icon: MessagesSquare, title: "Communication", text: "Messages between a patient and their connected professionals. Not for emergencies." },
  { icon: BellRing, title: "Reminders", text: "In-app notifications and email reminders where the operator has set up email." },
];

export function Features() {
  return (
    <section id="features" className="border-b border-line">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-[var(--space-section)] sm:px-6 lg:grid-cols-[1fr_1.7fr] lg:gap-16">
        <Reveal className="lg:sticky lg:top-28 lg:self-start">
          <h2 className="text-3xl font-semibold sm:text-4xl">What Tessera does</h2>
          <p className="mt-3 max-w-md text-lg text-ink2">Seven practical tools, no extras.</p>
        </Reveal>
        <ul className="border-t border-line2">
          {FEATURES.map((f, i) => (
            <li key={f.title} className="border-b border-line">
              <Reveal delay={0.03 * (i % 4)} className="group grid gap-1 py-5 transition-colors duration-200 hover:bg-surface2 sm:grid-cols-[13rem_1fr] sm:gap-6 sm:px-3">
                <h3 className="flex items-center gap-3 text-base font-semibold">
                  <span className="grid size-8 shrink-0 place-items-center rounded-md bg-accent-soft text-accent transition-colors duration-200 group-hover:bg-accent group-hover:text-onaccent">
                    <f.icon className="size-4" aria-hidden />
                  </span>
                  {f.title}
                </h3>
                <p className="text-ink2">{f.text}</p>
              </Reveal>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
