"use client";

import { useReducedMotion } from "@/lib/use-reduced-motion";
import { useEffect, useState } from "react";

/** Number that counts up from zero once on mount. The final value is what the server renders; reduced motion keeps it. */
export function CountUp({ value, suffix = "", duration = 800 }: { value: number; suffix?: string; duration?: number }) {
  const reduce = useReducedMotion();
  const [n, setN] = useState(value);

  useEffect(() => {
    if (reduce || value === 0) return;
    const start = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / duration);
      setN(Math.round(value * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value, duration, reduce]);

  return <span className="tabular-nums">{reduce ? value : n}{suffix}</span>;
}
