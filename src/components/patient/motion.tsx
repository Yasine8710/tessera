"use client";

import { animate, useInView, useReducedMotion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/cn";

/** Counts up to `value` the first time it scrolls into view. Renders the final value on the server and with reduced motion. */
export function CountUp({ value, suffix = "", className }: { value: number; suffix?: string; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });
  const reduce = useReducedMotion();
  const [shown, setShown] = useState<number | null>(null);

  useEffect(() => {
    if (reduce || !inView) return;
    const controls = animate(0, value, { duration: 0.8, ease: [0.2, 0.7, 0.2, 1], onUpdate: (v) => setShown(Math.round(v)) });
    return () => controls.stop();
  }, [inView, reduce, value]);

  return (
    <span ref={ref} className={cn("tabular-nums", className)}>
      {shown !== null && !reduce ? shown : value}
      {suffix}
    </span>
  );
}

/** Horizontal progress bar: grows in on first view, and the fill animates when the value changes. */
export function ProgressBar({ value, max, label, className }: { value: number; max: number; label: string; className?: string }) {
  const pct = max ? Math.min(100, Math.round((value / max) * 100)) : 0;
  return (
    <div role="progressbar" aria-label={label} aria-valuemin={0} aria-valuemax={max} aria-valuenow={value} className={cn("h-2 overflow-hidden rounded-sm bg-surface2", className)}>
      <div className="anim-grow-x h-full bg-accent transition-[width] duration-[var(--t-slow)] ease-[var(--ease)]" style={{ width: `${pct}%` }} />
    </div>
  );
}

/** Circular progress; the arc is drawn with stroke-dashoffset. */
export function ProgressRing({ value, max, size = 72, label, children }: { value: number; max: number; size?: number; label: string; children?: React.ReactNode }) {
  const r = 30;
  const len = 2 * Math.PI * r;
  const pct = max ? Math.min(1, value / max) : 0;
  return (
    <div role="progressbar" aria-label={label} aria-valuemin={0} aria-valuemax={max} aria-valuenow={value} className="relative shrink-0" style={{ width: size, height: size }}>
      <svg viewBox="0 0 72 72" width={size} height={size} className="-rotate-90" aria-hidden>
        <circle cx="36" cy="36" r={r} fill="none" stroke="var(--c-border)" strokeWidth="6" />
        <circle
          cx="36"
          cy="36"
          r={r}
          fill="none"
          stroke="var(--c-accent)"
          strokeWidth="6"
          className="anim-draw"
          style={{ "--len": len, strokeDasharray: len, strokeDashoffset: len * (1 - pct), transition: "stroke-dashoffset var(--t-slow) var(--ease)" } as React.CSSProperties}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center text-sm font-semibold tabular-nums">{children}</div>
    </div>
  );
}
