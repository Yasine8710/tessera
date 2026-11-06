"use client";

import { useState } from "react";
import { cn } from "@/lib/cn";

const CATEGORIES = [
  { key: "journal", label: "Health journal", sees: "Shared journal entries" },
  { key: "measurements", label: "Measurements", sees: "Blood pressure and weight readings" },
  { key: "routines", label: "Routines", sees: "Routine completion" },
  { key: "adherence", label: "Medication adherence", sees: "Doses taken or skipped" },
] as const;
type Key = (typeof CATEGORIES)[number]["key"];

/** Interactive illustration of per-category consent. Synthetic, nothing is sent anywhere. */
export function ConsentDemo() {
  const [on, setOn] = useState<Record<Key, boolean>>({ journal: false, measurements: true, routines: true, adherence: true });
  const shared = CATEGORIES.filter((c) => on[c.key]);

  return (
    <figure aria-label="Interactive illustration of consent settings" className="overflow-hidden rounded-lg border border-line bg-surface shadow-sm">
      <div className="grid sm:grid-cols-2 sm:divide-x sm:divide-line">
        <div className="px-5 py-4">
          <p className="text-sm font-semibold">You share with Dr Sample</p>
          <ul className="mt-3 divide-y divide-line">
            {CATEGORIES.map((c) => (
              <li key={c.key} className="flex items-center justify-between gap-3 py-2.5">
                <span id={`consent-${c.key}`} className="text-sm">
                  {c.label}
                </span>
                <button
                  type="button"
                  role="switch"
                  aria-checked={on[c.key]}
                  aria-labelledby={`consent-${c.key}`}
                  onClick={() => setOn((p) => ({ ...p, [c.key]: !p[c.key] }))}
                  className={cn(
                    "press relative h-6 w-11 shrink-0 rounded-md border transition-colors duration-200",
                    on[c.key] ? "border-accent bg-accent" : "border-line2 bg-surface2",
                  )}
                >
                  <span
                    aria-hidden
                    className={cn(
                      "absolute left-0.5 top-0.5 size-4 rounded-[3px] transition-transform duration-200 ease-[var(--ease-spring)]",
                      on[c.key] ? "translate-x-5 bg-onaccent" : "translate-x-0 bg-muted",
                    )}
                  />
                </button>
              </li>
            ))}
          </ul>
        </div>
        <div className="border-t border-line bg-surface2 px-5 py-4 sm:border-t-0">
          <p className="text-sm font-semibold">What Dr Sample can see</p>
          <ul className="mt-3" aria-live="polite">
            {CATEGORIES.map((c) => (
              <li key={c.key} aria-hidden={!on[c.key]} className={cn("grid transition-all duration-300 ease-[var(--ease)]", on[c.key] ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0")}>
                <span className="flex items-center gap-2.5 overflow-hidden py-1 text-sm text-ink2">
                  <span className="size-1.5 shrink-0 rounded-[1px] bg-accent" aria-hidden />
                  <span>{c.sees}</span>
                </span>
              </li>
            ))}
          </ul>
          {shared.length === 0 && <p className="anim-fade text-sm text-muted">Nothing is shared.</p>}
        </div>
      </div>
      <figcaption className="border-t border-line px-5 py-2.5 text-xs text-muted">Illustration with synthetic data. Try the switches.</figcaption>
    </figure>
  );
}
