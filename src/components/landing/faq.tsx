"use client";

import { useId, useState } from "react";
import { Plus } from "lucide-react";
import { Reveal } from "@/components/ui/reveal";
import { cn } from "@/lib/cn";
import { Figure, Rule, SectionLabel, Words } from "./editorial";
import { wrap } from "./layout";

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

function Item({ n, q, a, open, onToggle }: { n: number; q: string; a: string; open: boolean; onToggle: () => void }) {
  const id = useId();
  return (
    <li>
      <Rule />
      <h3>
        <button
          type="button"
          aria-expanded={open}
          aria-controls={`${id}-p`}
          id={`${id}-b`}
          onClick={onToggle}
          className="group flex w-full items-baseline gap-4 py-5 text-left transition-colors hover:text-accent"
        >
          <span className="w-8 shrink-0 text-sm font-semibold tabular-nums text-muted" aria-hidden>
            {String(n).padStart(2, "0")}
          </span>
          <span className="flex-1 text-lg font-semibold tracking-tight">{q}</span>
          <Plus className={cn("size-5 shrink-0 self-center text-muted transition-transform duration-300 ease-[var(--ease)]", open && "rotate-45 text-accent")} aria-hidden />
        </button>
      </h3>
      <div id={`${id}-p`} role="region" aria-labelledby={`${id}-b`} className={cn("grid transition-[grid-template-rows,opacity] duration-300 ease-[var(--ease)]", open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0")} inert={!open}>
        <div className="overflow-hidden">
          <p className="max-w-2xl pb-6 pl-12 pr-8 text-ink2">{a}</p>
        </div>
      </div>
    </li>
  );
}

export function Faq() {
  const [open, setOpen] = useState<Set<number>>(() => new Set([0]));
  const toggle = (i: number) =>
    setOpen((p) => {
      const n = new Set(p);
      if (n.has(i)) n.delete(i);
      else n.add(i);
      return n;
    });
  return (
    <section id="faq" className="border-b border-line bg-surface2">
      <div className={`${wrap} py-[var(--space-section)]`}>
        <SectionLabel n="08">Questions</SectionLabel>
        <div className="mt-10 grid gap-12 lg:grid-cols-12 lg:gap-16">
          <div className="lg:sticky lg:top-28 lg:col-span-4 lg:self-start">
            <Words as="h2" className="display-lg" text="Frequently asked questions" />
            <Figure
              name="walk-coat"
              sizes="(min-width: 1024px) 33vw, 100vw"
              focal="50% 35%"
              className="mt-8 aspect-[4/3] w-full max-w-md lg:max-w-none"
            />
          </div>
          <Reveal delay={0.05} className="lg:col-span-8">
            <ul>
              {FAQ.map((f, i) => (
                <Item key={f.q} n={i + 1} q={f.q} a={f.a} open={open.has(i)} onToggle={() => toggle(i)} />
              ))}
              <li aria-hidden>
                <Rule />
              </li>
            </ul>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
