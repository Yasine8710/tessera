"use client";

import Link from "next/link";
import { motion, useScroll, useSpring } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { Menu, X } from "lucide-react";
import { Logo } from "@/components/logo";
import { ThemeToggle } from "@/components/theme";
import { LinkButton } from "@/components/ui/button";
import { cn } from "@/lib/cn";

const LINKS = [
  { href: "/#features", label: "Features" },
  { href: "/#patients", label: "For Patients" },
  { href: "/#staff", label: "For Medical Staff" },
  { href: "/#security", label: "Security" },
  { href: "/#faq", label: "FAQ" },
];

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState<string | null>(null);
  const btn = useRef<HTMLButtonElement>(null);
  const { scrollYProgress } = useScroll();
  const progress = useSpring(scrollYProgress, { stiffness: 220, damping: 32, mass: 0.4 });

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        btn.current?.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  // Mark the nav link of the section currently in the reading band (landing page only).
  useEffect(() => {
    const els = LINKS.map((l) => document.getElementById(l.href.slice(2))).filter((e): e is HTMLElement => !!e);
    if (!els.length || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) if (e.isIntersecting) setActive(e.target.id);
      },
      { rootMargin: "-30% 0px -60% 0px" },
    );
    els.forEach((e) => io.observe(e));
    return () => io.disconnect();
  }, []);

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-bg">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-10">
        <Logo />
        <nav aria-label="Primary" className="hidden items-center gap-7 lg:flex">
          {LINKS.map((l) => {
            const on = active === l.href.slice(2);
            return (
              <Link
                key={l.href}
                href={l.href}
                aria-current={on ? "location" : undefined}
                className={cn(
                  "relative py-1 text-sm font-medium after:absolute after:inset-x-0 after:-bottom-0.5 after:h-0.5 after:origin-left after:rounded-full after:bg-accent after:transition-transform after:duration-300 hover:text-ink hover:after:scale-x-100",
                  on ? "text-ink after:scale-x-100" : "text-ink2 after:scale-x-0",
                )}
              >
                {l.label}
              </Link>
            );
          })}
        </nav>
        <div className="hidden items-center gap-2 lg:flex">
          <ThemeToggle />
          <LinkButton href="/login" variant="ghost">
            Sign In
          </LinkButton>
          <LinkButton href="/register" className="press">
            Get Started
          </LinkButton>
        </div>
        <div className="flex items-center gap-2 lg:hidden">
          <ThemeToggle />
          <button
            ref={btn}
            type="button"
            className="press inline-flex size-9 items-center justify-center rounded-md border border-line2 text-ink hover:bg-surface2"
            aria-expanded={open}
            aria-controls="mobile-menu"
            aria-label={open ? "Close menu" : "Open menu"}
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <X key="x" className="anim-scale size-5" aria-hidden /> : <Menu key="m" className="anim-scale size-5" aria-hidden />}
          </button>
        </div>
      </div>
      {open && (
        <nav id="mobile-menu" aria-label="Mobile" className="anim-fade border-t border-line bg-bg px-4 pb-5 pt-2 lg:hidden">
          <ul className="stagger divide-y divide-line">
            {LINKS.map((l) => (
              <li key={l.href}>
                <Link href={l.href} onClick={() => setOpen(false)} className="block py-3 font-medium text-ink2 hover:text-ink">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
          <div className="anim-up mt-4 grid grid-cols-2 gap-2">
            <LinkButton href="/login" variant="secondary" onClick={() => setOpen(false)}>
              Sign In
            </LinkButton>
            <LinkButton href="/register" onClick={() => setOpen(false)}>
              Get Started
            </LinkButton>
          </div>
        </nav>
      )}
      <motion.div aria-hidden style={{ scaleX: progress }} className="absolute inset-x-0 bottom-[-1px] h-0.5 origin-left bg-accent" />
    </header>
  );
}
