"use client";

import { Monitor, Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";
import { cn } from "@/lib/cn";

type Mode = "system" | "light" | "dark";
const KEY = "tessera-theme";
const ORDER: Mode[] = ["system", "light", "dark"];

/** Runs before first paint (inline in <head>) so there is no flash of the wrong theme. */
export const themeInitScript = `(function(){try{var m=localStorage.getItem("${KEY}")||"system";var d=m==="dark"||(m==="system"&&matchMedia("(prefers-color-scheme: dark)").matches);document.documentElement.dataset.theme=d?"dark":"light";}catch(e){}})();`;

function apply(mode: Mode) {
  const dark = mode === "dark" || (mode === "system" && matchMedia("(prefers-color-scheme: dark)").matches);
  const set = () => {
    document.documentElement.dataset.theme = dark ? "dark" : "light";
  };
  const vt = (document as Document & { startViewTransition?: (cb: () => void) => unknown }).startViewTransition;
  if (vt && !matchMedia("(prefers-reduced-motion: reduce)").matches) vt.call(document, set);
  else set();
}

export function ThemeToggle({ className, onDark }: { className?: string; onDark?: boolean }) {
  const [mode, setMode] = useState<Mode>("system");

  useEffect(() => {
    try {
      setMode((localStorage.getItem(KEY) as Mode) || "system");
    } catch {}
    const mq = matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => {
      let m: Mode = "system";
      try {
        m = (localStorage.getItem(KEY) as Mode) || "system";
      } catch {}
      if (m === "system") apply("system");
    };
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  function next() {
    const n = ORDER[(ORDER.indexOf(mode) + 1) % ORDER.length];
    setMode(n);
    try {
      localStorage.setItem(KEY, n);
    } catch {}
    apply(n);
  }

  const label = mode === "system" ? "Theme: match system" : mode === "light" ? "Theme: light" : "Theme: dark";
  const Icon = mode === "system" ? Monitor : mode === "light" ? Sun : Moon;
  return (
    <button
      type="button"
      onClick={next}
      aria-label={`${label}. Activate to change.`}
      title={label}
      className={cn(
        "press inline-flex size-9 items-center justify-center rounded-md border",
        onDark ? "border-white/15 text-nav-ink hover:bg-white/10" : "border-line text-ink2 hover:bg-surface2 hover:text-ink",
        className,
      )}
    >
      <Icon key={mode} className="size-[1.15rem] anim-scale" aria-hidden />
    </button>
  );
}
