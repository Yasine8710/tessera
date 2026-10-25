import { ChevronDown } from "lucide-react";
import { Reveal } from "@/components/ui/reveal";

const FAQ = [
  { q: "Who can create an account?", a: "Anyone can register as a patient. Medical professionals can register too, but staff access starts only after an administrator verifies their licence details." },
  { q: "What is the difference between the roles?", a: "Patients track their own medications, routines and journal. Professionals review data patients have chosen to share and coordinate follow-up. Administrators approve professionals and manage accounts." },
  { q: "How do invitations work?", a: "A verified professional enters your email address. You get a single-use link that expires. Sign in or register with that same email, review the invitation, and choose what to share before accepting. You can also decline." },
  { q: "How does medication tracking work?", a: "Your care team sets the schedule. Each dose appears at its time and you mark it taken or skipped. CareSync does not suggest doses and does not replace advice from your clinician." },
  { q: "Who can see my information?", a: "You can. A professional sees only the categories you allow, and only while a care relationship is active. You can change this or end the relationship at any time. The operator of the server has technical access to stored data." },
  { q: "Is the data from patients verified?", a: "No. Entries are self-reported and may be incomplete. Staff are shown them as such." },
  { q: "Is CareSync really free?", a: "Yes. There are no subscriptions, premium tiers or ads, and data is never sold. The operator pays for hosting, email and the database." },
  { q: "Can I use it in an emergency?", a: "No. CareSync is not an emergency service and messages are not monitored around the clock. Contact your local emergency number." },
];

export function Faq() {
  return (
    <section id="faq" className="border-b border-line bg-surface2">
      <div className="mx-auto max-w-3xl px-4 py-[var(--space-section)] sm:px-6">
        <Reveal>
          <h2 className="text-3xl font-semibold sm:text-4xl">Frequently asked questions</h2>
        </Reveal>
        <div className="mt-8 divide-y divide-line rounded-lg border border-line bg-surface">
          {FAQ.map((f) => (
            <details key={f.q} className="group px-5">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-4 font-medium [&::-webkit-details-marker]:hidden">
                {f.q}
                <ChevronDown className="size-4 shrink-0 text-muted transition-transform group-open:rotate-180" aria-hidden />
              </summary>
              <p className="pb-4 text-ink2">{f.a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
