import Link from "next/link";
import { cn } from "@/lib/cn";

/**
 * Tessera mark: a T built from five small square tiles, the last one in the accent colour.
 * One tile out of many is the one that is "in sync".
 */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={cn("size-8", className)} aria-hidden>
      <g fill="var(--c-ink)">
        <rect x="4" y="4" width="16" height="16" rx="2.5" />
        <rect x="24" y="4" width="16" height="16" rx="2.5" />
        <rect x="44" y="4" width="16" height="16" rx="2.5" />
        <rect x="24" y="24" width="16" height="16" rx="2.5" />
      </g>
      <rect x="24" y="44" width="16" height="16" rx="2.5" fill="var(--c-accent)" />
    </svg>
  );
}

export function Logo({ href = "/", light, className }: { href?: string; light?: boolean; className?: string }) {
  return (
    <Link
      href={href}
      className={cn("group inline-flex items-center gap-2.5 font-semibold tracking-tight", light ? "text-nav-ink" : "text-ink", className)}
      aria-label="Tessera home"
    >
      <LogoMark className={cn("transition-transform duration-300 group-hover:rotate-[-4deg] group-hover:scale-105", light && "[&_g]:fill-current")} />
      <span className="text-lg">Tessera</span>
    </Link>
  );
}
