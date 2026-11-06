"use client";

import { motion } from "motion/react";
import { useReducedMotion } from "@/lib/use-reduced-motion";
import { useEffect, useRef, useState } from "react";

/**
 * Subtle entrance for below-the-fold content. Content is rendered visible on the server and
 * before hydration (no-JS, crawlers, print); only after mount is off-screen content armed to fade in
 * when scrolled into view. Skipped entirely when the user prefers reduced motion.
 */
export function Reveal({ children, delay = 0, className }: { children: React.ReactNode; delay?: number; className?: string }) {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const [state, setState] = useState<"visible" | "hidden">("visible");

  useEffect(() => {
    const el = ref.current;
    if (reduce || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setState("visible"); // the preference is only known after hydration: undo anything armed before it
      return;
    }
    if (!el || typeof IntersectionObserver === "undefined") return;
    if (el.getBoundingClientRect().top <= window.innerHeight) return; // already on screen
    setState("hidden");
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setState("visible");
          io.disconnect();
        }
      },
      { rootMargin: "0px 0px -60px 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [reduce]);

  return (
    <motion.div
      ref={ref}
      className={className}
      initial={false}
      animate={state === "hidden" ? { opacity: 0, y: 12 } : { opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay: state === "visible" ? delay : 0, ease: [0.2, 0.7, 0.2, 1] }}
    >
      {children}
    </motion.div>
  );
}
