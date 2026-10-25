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
      <div className="mx-auto max-w-6xl px-4 py-[var(--space-section)] sm:px-6">
        <Reveal>
          <h2 className="text-3xl font-semibold sm:text-4xl">What CareSync does</h2>
          <p className="mt-3 max-w-2xl text-lg text-ink2">Seven practical tools, no extras.</p>
        </Reveal>
        <ul className="mt-10 grid gap-x-10 gap-y-8 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map((f, i) => (
            <li key={f.title} className={i === 0 ? "lg:col-span-2" : undefined}>
            <Reveal delay={(i % 4) * 0.05}>
              <div className="border-t border-line2 pt-4">
                <h3 className="flex items-center gap-2.5 text-base font-semibold">
                  <f.icon className="size-5 text-accent" aria-hidden />
                  {f.title}
                </h3>
                <p className="mt-1.5 text-ink2">{f.text}</p>
              </div>
            </Reveal>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
