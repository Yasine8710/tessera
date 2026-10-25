import Link from "next/link";
import { cn } from "@/lib/cn";

export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={cn("size-8", className)} aria-hidden>
      <rect width="64" height="64" rx="14" fill="#0f2a33" />
      <path d="M14 33h9l5-12 8 24 6-16 3 4h5" fill="none" stroke="#5fd0c8" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function Logo({ href = "/", light, className }: { href?: string; light?: boolean; className?: string }) {
  return (
    <Link href={href} className={cn("inline-flex items-center gap-2.5 font-semibold tracking-tight", light ? "text-white" : "text-ink", className)} aria-label="CareSync home">
      <LogoMark />
      <span className="text-lg">CareSync</span>
    </Link>
  );
}
