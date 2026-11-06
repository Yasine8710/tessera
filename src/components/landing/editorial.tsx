"use client";

import { animate, motion, useScroll, useTransform } from "motion/react";
import { useReducedMotion } from "@/lib/use-reduced-motion";
import { Fragment, useEffect, useRef, useState } from "react";
import { Photo } from "@/components/ui/photo";
import type { PhotoName } from "@/lib/photos";
import { cn } from "@/lib/cn";

/**
 * Editorial motion kit. Everything is rendered in its final state on the server and before hydration
 * (no-JS, crawlers, print). After mount, content that is below the fold is armed and plays when it
 * scrolls into view. With prefers-reduced-motion nothing is armed and nothing moves.
 */
function useArmed<T extends HTMLElement>(threshold = 0.9) {
  const reduce = useReducedMotion();
  const ref = useRef<T>(null);
  const [hidden, setHidden] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (reduce || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setHidden(false);
      return;
    }
    if (!el || typeof IntersectionObserver === "undefined") return;
    if (el.getBoundingClientRect().top <= window.innerHeight * threshold) return;
    setHidden(true);
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setHidden(false);
          io.disconnect();
        }
      },
      { rootMargin: "0px 0px -8% 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [reduce, threshold]);
  return { ref, hidden };
}

/** Heading that reveals word by word. `immediate` plays on load (above the fold), otherwise on scroll. */
export function Words({
  text,
  as = "h2",
  className,
  immediate,
  delay = 0,
}: {
  text: string;
  as?: "h1" | "h2" | "h3" | "p";
  className?: string;
  immediate?: boolean;
  delay?: number;
}) {
  const { ref, hidden } = useArmed<HTMLElement>();
  const Tag = as as React.ElementType;
  const words = text.split(" ");
  return (
    <Tag ref={ref} className={className}>
      {words.map((w, i) => (
        <Fragment key={i}>
          <span className="inline-block overflow-hidden pb-[0.14em] align-bottom -mb-[0.14em]">
            <span
              className={cn("inline-block transition-[transform,opacity] duration-[800ms] ease-[var(--ease)]", immediate && "anim-up")}
              style={
                immediate
                  ? { animationDelay: `${delay + i * 70}ms` }
                  : { transform: hidden ? "translateY(110%)" : "none", opacity: hidden ? 0 : 1, transitionDelay: `${delay + i * 55}ms` }
              }
            >
              {w}
            </span>
          </span>
          {i < words.length - 1 && " "}
        </Fragment>
      ))}
    </Tag>
  );
}

/** A hairline that draws itself in. */
export function Rule({ className }: { className?: string }) {
  const { ref, hidden } = useArmed<HTMLDivElement>(1);
  return (
    <div
      ref={ref}
      aria-hidden
      className={cn("h-px origin-left bg-line2 transition-transform duration-[900ms] ease-[var(--ease)]", className)}
      style={{ transform: hidden ? "scaleX(0)" : "none" }}
    />
  );
}

/** "01 ———— Label" marker that opens each numbered section. */
export function SectionLabel({ n, children }: { n: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-4">
      <span className="text-sm font-semibold tabular-nums text-ink" aria-hidden>
        {n}
      </span>
      <Rule className="w-12 sm:w-20" />
      <span className="eyebrow">{children}</span>
    </div>
  );
}

/** Counts up to `to` when scrolled into view. Screen readers get the final number only. */
export function CountUp({ to, className, decorative }: { to: number; className?: string; decorative?: boolean }) {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLSpanElement>(null);
  const [v, setV] = useState(to);
  useEffect(() => {
    const el = ref.current;
    if (reduce || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setV(to);
      return;
    }
    if (!el || typeof IntersectionObserver === "undefined") return;
    let controls: { stop: () => void } | undefined;
    setV(0);
    const io = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      io.disconnect();
      controls = animate(0, to, { duration: 1.4, ease: [0.2, 0.7, 0.2, 1], onUpdate: (n) => setV(Math.round(n)) });
    });
    io.observe(el);
    return () => {
      io.disconnect();
      controls?.stop();
    };
  }, [reduce, to]);
  return (
    <>
      <span ref={ref} aria-hidden className={cn("tabular-nums", className)}>
        {v}
      </span>
      {!decorative && <span className="sr-only">{to}</span>}
    </>
  );
}

/** Photo with a curtain reveal and a slow parallax drift. `immediate` uses the CSS curtain on load. */
export function Figure({
  name,
  alt = "",
  className,
  focal,
  sizes,
  priority,
  immediate,
  parallax = true,
  kenburns,
}: {
  name: PhotoName;
  alt?: string;
  className?: string;
  focal?: string;
  sizes?: string;
  priority?: boolean;
  immediate?: boolean;
  parallax?: boolean;
  kenburns?: boolean;
}) {
  const reduce = useReducedMotion();
  const { ref, hidden } = useArmed<HTMLDivElement>(0.95);
  const drift = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: drift, offset: ["start end", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], ["-6%", "6%"]);
  const moving = parallax && !reduce;

  return (
    <div
      ref={ref}
      className={cn("group relative overflow-hidden bg-surface2", immediate && !reduce && "mask-up", kenburns && "kenburns", className)}
      style={immediate ? undefined : { clipPath: hidden ? "inset(100% 0 0 0)" : "inset(0)", transition: "clip-path 1000ms var(--ease)" }}
    >
      <div ref={drift} className="absolute inset-0 overflow-hidden">
        {moving ? (
          <motion.div style={{ y }} className="absolute inset-x-0 -inset-y-[8%]">
            <Photo name={name} alt={alt} focal={focal} sizes={sizes} priority={priority} className="size-full" />
          </motion.div>
        ) : (
          <Photo name={name} alt={alt} focal={focal} sizes={sizes} priority={priority} className="size-full" />
        )}
      </div>
    </div>
  );
}
