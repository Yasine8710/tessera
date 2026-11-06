"use client";

import { motion, useReducedMotion } from "motion/react";
import Link from "next/link";
import { useId } from "react";
import { cn } from "@/lib/cn";

const spring = { type: "spring", stiffness: 520, damping: 40 } as const;

/** Underline tabs; the accent indicator slides between the active tab. */
export function TabNavClient({ patientId, active, tabs }: { patientId: string; active: string; tabs: readonly { id: string; label: string }[] }) {
  const gid = useId();
  const reduce = useReducedMotion();
  return (
    <nav aria-label="Patient sections" className="-mx-4 mb-6 overflow-x-auto border-b border-line px-4 sm:mx-0 sm:px-0">
      <ul className="flex min-w-max gap-1">
        {tabs.map((t) => (
          <li key={t.id}>
            <Link
              href={`/staff/patients/${patientId}?tab=${t.id}`}
              aria-current={active === t.id ? "page" : undefined}
              className={cn(
                "relative inline-block whitespace-nowrap px-3 py-2.5 text-sm transition-colors duration-[var(--t-fast)]",
                active === t.id ? "font-medium text-accent-hover" : "text-ink2 hover:text-ink",
              )}
            >
              {t.label}
              {active === t.id && (
                <motion.span layoutId={`${gid}-tab`} transition={reduce ? { duration: 0 } : spring} className="absolute inset-x-0 -bottom-px h-0.5 bg-accent" aria-hidden />
              )}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}

/** Segmented period switch (7 / 30 / 90 days) with a sliding highlight. */
export function PeriodLinks({ items }: { items: { label: string; href: string; active: boolean }[] }) {
  const gid = useId();
  const reduce = useReducedMotion();
  return (
    <div className="inline-flex rounded-md border border-line2 bg-surface p-0.5" role="group" aria-label="Period">
      {items.map((i) => (
        <Link
          key={i.href}
          href={i.href}
          aria-current={i.active ? "true" : undefined}
          className={cn("relative rounded-sm px-3 py-1.5 text-sm transition-colors duration-[var(--t-fast)] press", i.active ? "font-medium text-accent-hover" : "text-ink2 hover:text-ink")}
        >
          {i.active && <motion.span layoutId={`${gid}-seg`} transition={reduce ? { duration: 0 } : spring} className="absolute inset-0 rounded-sm bg-accent-soft" aria-hidden />}
          <span className="relative">{i.label}</span>
        </Link>
      ))}
    </div>
  );
}
