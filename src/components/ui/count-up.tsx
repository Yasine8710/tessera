"use client";

import { useReducedMotion } from "@/lib/use-reduced-motion";
import { useEffect, useState } from "react";

/** Counts from 0 to `value` once on mount (ease-out). Shows the final value immediately for reduced motion and on the server. */
export function CountUp({ value, duration = 900, className }: { value: number; duration?: number; className?: string }) {
  const reduce = useReducedMotion();
  const [shown, setShown] = useState(value);

  useEffect(() => {
    if (reduce || value === 0) return;
    let raf = 0;
    const t0 = performance.now();
    const tick = (t: number) => {
      const p = Math.min((t - t0) / duration, 1);
      setShown(Math.round(value * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value, reduce, duration]);

  return <span className={className}>{reduce ? value : shown}</span>;
}
