import { Plus } from "lucide-react";
import { Reveal } from "@/components/ui/reveal";

const FAQ = [
  { q: "Who can create an account?", a: "Anyone can register as a patient. Medical professionals can register too, but staff access starts only after an administrator verifies their licence details." },
  { q: "What is the difference between the roles?", a: "Patients track their own medications, routines and journal. Professionals review data patients have chosen to share and coordinate follow-up. Administrators approve professionals and manage accounts." },
  { q: "How do invitations work?", a: "A verified professional enters your email address. You get a single-use link that expires. Sign in or register with that same email, review the invitation, and choose what to share before accepting. You can also decline." },
  { q: "How does medication tracking work?", a: "Your care team sets the schedule. Each dose appears at its time and you mark it taken or skipped. Tessera does not suggest doses and does not replace advice from your clinician." },
  { q: "Who can see my information?", a: "You can. A professional sees only the categories you allow, and only while a care relationship is active. You can change this or end the relationship at any time. The operator of the server has technical access to stored data." },
  { q: "Is the data from patients verified?", a: "No. Entries are self-reported and may be incomplete. Staff are shown them as such." },
  { q: "Is Tessera really free?", a: "Yes. There are no subscriptions, premium tiers or ads, and data is never sold. The operator pays for hosting, email and the database." },
  { q: "Can I use it in an emergency?", a: "No. Tessera is not an emergency service and messages are not monitored around the clock. Contact your local emergency number." },
];

export function Faq() {
  return (
    <section id="faq" className="border-b border-line bg-surface2">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-[var(--space-section)] sm:px-6 lg:grid-cols-[1fr_1.7fr] lg:gap-16">
        <Reveal className="lg:sticky lg:top-28 lg:self-start">
          <h2 className="text-3xl font-semibold sm:text-4xl">Frequently asked questions</h2>
        </Reveal>
        <Reveal delay={0.05}>
          <div className="border-t border-line2">
            {FAQ.map((f) => (
              <details key={f.q} className="group border-b border-line">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-4 font-medium transition-colors hover:text-accent [&::-webkit-details-marker]:hidden">
                  {f.q}
                  <Plus className="size-4 shrink-0 text-muted transition-transform duration-300 group-open:rotate-45 group-open:text-accent" aria-hidden />
                </summary>
                <p className="animate-[fade-up_320ms_var(--ease)_both] pb-5 pr-8 text-ink2">{f.a}</p>
              </details>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}
