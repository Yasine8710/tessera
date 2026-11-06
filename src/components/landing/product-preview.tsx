"use client";

import { useReducedMotion } from "@/lib/use-reduced-motion";
import { useEffect, useState } from "react";
import { CalendarClock, Droplets, Pill } from "lucide-react";
import { Badge } from "@/components/ui/card";
import { cn } from "@/lib/cn";

/**
 * Synthetic data. A short loop shows the point of the product: a patient marks a dose taken,
 * the schedule and the care-team adherence bar update from the same state.
 * Reduced motion: jumps to the final state and does not loop.
 */
const DOSES = [
  { name: "Sample medication A", detail: "1 tablet with breakfast", time: "08:00" },
  { name: "Sample medication B", detail: "1 capsule", time: "13:00" },
  { name: "Sample medication A", detail: "1 tablet with dinner", time: "19:00" },
];
type DoseState = "taken" | "due" | "upcoming";
// step 0: initial, 1: second dose taken, 2: third dose taken.
const STATES: DoseState[][] = [
  ["taken", "due", "upcoming"],
  ["taken", "taken", "due"],
  ["taken", "taken", "taken"],
];
const STATE_LABEL: Record<DoseState, string> = { taken: "Taken", due: "Due", upcoming: "Upcoming" };
const STATE_TONE = { taken: "ok", due: "warn", upcoming: "neutral" } as const;

const WEEK = [
  { d: "Mon", v: 100 },
  { d: "Tue", v: 100 },
  { d: "Wed", v: 67 },
  { d: "Thu", v: 100 },
  { d: "Fri", v: 100 },
  { d: "Sat", v: 33 },
];

export function ProductPreview() {
  const reduce = useReducedMotion();
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (reduce) {
      setStep(2);
      return;
    }
    const timers: ReturnType<typeof setTimeout>[] = [];
    const cycle = () => {
      setStep(0);
      timers.push(setTimeout(() => setStep(1), 1900));
      timers.push(setTimeout(() => setStep(2), 3700));
      timers.push(setTimeout(cycle, 10000));
    };
    timers.push(setTimeout(cycle, 600));
    return () => timers.forEach(clearTimeout);
  }, [reduce]);

  const states = STATES[step];
  const done = states.filter((s) => s === "taken").length;
  const todayPct = Math.round((done / states.length) * 100);

  return (
    <figure aria-label="Illustrative preview of the Tessera interface" className="relative">
      <div className="overflow-hidden rounded-lg border border-line bg-surface shadow-md">
        <div className="flex items-center justify-between gap-3 border-b border-line bg-surface2 px-4 py-2.5">
          <div className="flex items-center gap-1.5" aria-hidden>
            <span className="size-2 rounded-[2px] bg-line2" />
            <span className="size-2 rounded-[2px] bg-line2" />
            <span className="size-2 rounded-[2px] bg-accent" />
          </div>
          <p className="text-xs text-muted">Patient view, sample data</p>
        </div>

        <div className="flex items-end justify-between gap-3 px-5 pb-2 pt-4">
          <div>
            <p className="text-base font-semibold">Today</p>
            <p className="text-sm text-muted">Sample Patient</p>
          </div>
          <p className="text-sm tabular-nums text-ink2" aria-live="off">
            <span className="font-semibold text-ink">{done}</span> of {states.length} doses taken
          </p>
        </div>

        <ul className="stagger divide-y divide-line">
          {DOSES.map((d, i) => {
            const s = states[i];
            return (
              <li key={i} className={cn("flex items-center gap-3 px-5 py-3", s === "due" && "bg-accent-soft")}>
                <span
                  className={cn(
                    "grid size-6 shrink-0 place-items-center rounded-full border-2 transition-colors duration-300",
                    s === "taken" ? "border-ok bg-ok text-bg" : s === "due" ? "border-accent" : "border-line2",
                  )}
                  aria-hidden
                >
                  {s === "taken" && (
                    <svg key="tick" viewBox="0 0 16 16" className="size-3.5" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M3.5 8.5l3 3 6-7" className="anim-draw" style={{ ["--len" as string]: 14 }} />
                    </svg>
                  )}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium">{d.name}</span>
                  <span className="block truncate text-xs text-muted">{d.detail}</span>
                </span>
                <span className="text-sm tabular-nums text-ink2">{d.time}</span>
                <Badge key={s} tone={STATE_TONE[s]} className="anim-scale w-[4.75rem] justify-center">
                  {STATE_LABEL[s]}
                </Badge>
              </li>
            );
          })}
        </ul>

        <div className="grid border-t border-line sm:grid-cols-[1fr_1.25fr] sm:divide-x sm:divide-line">
          <div className="px-5 py-4">
            <p className="text-sm font-semibold">Routines</p>
            <ul className="mt-3 space-y-2.5 text-sm">
              <li className="flex items-center gap-2.5">
                <Droplets className="size-4 text-info" aria-hidden />
                <span className="flex-1">Hydration check-in</span>
                <Badge tone="ok">Done</Badge>
              </li>
              <li className="flex items-center gap-2.5">
                <CalendarClock className="size-4 text-info" aria-hidden />
                <span className="flex-1">Evening walk</span>
                <Badge>18:30</Badge>
              </li>
            </ul>
          </div>
          <div className="border-t border-line px-5 py-4 sm:border-t-0">
            <p className="text-sm font-semibold">Care team view</p>
            <p className="text-xs text-muted">Self-reported adherence, 7 days</p>
            <div className="mt-3 flex h-16 items-end gap-1.5" role="img" aria-label="Sample seven day adherence: 100, 100, 67, 100, 100, 33 percent, then today">
              {[...WEEK, { d: "Today", v: todayPct }].map((w, i) => (
                <div key={w.d} className="flex h-full flex-1 items-end" aria-hidden>
                  <div
                    className={cn("anim-grow-y w-full rounded-[2px] transition-[height,background-color] duration-500 ease-[var(--ease)]", i === WEEK.length ? "bg-accent" : "bg-line2")}
                    style={{ height: `${Math.max(w.v, 8)}%`, animationDelay: `${300 + i * 60}ms` }}
                  />
                </div>
              ))}
            </div>
            <div className="mt-1 flex gap-1.5 text-center text-[0.65rem] text-muted" aria-hidden>
              {[...WEEK, { d: "Today" }].map((w) => (
                <span key={w.d} className="flex-1">
                  {w.d === "Today" ? "Now" : w.d}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
      <figcaption className="mt-3 flex items-start gap-2 text-xs text-muted">
        <Pill className="mt-px size-3.5 shrink-0" aria-hidden />
        Illustrative preview with synthetic data. It shows the type of information the app displays, not a real person.
      </figcaption>
    </figure>
  );
}
