import Link from "next/link";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/cn";

const base =
  "inline-flex items-center justify-center gap-2 rounded-md font-medium whitespace-nowrap transition-colors duration-[var(--t-fast)] disabled:cursor-not-allowed disabled:opacity-55 select-none";

const variants = {
  primary: "bg-accent text-white hover:bg-accent-hover",
  secondary: "bg-surface text-ink border border-line2 hover:bg-surface2",
  ghost: "text-ink2 hover:bg-surface2",
  danger: "bg-danger text-white hover:brightness-95",
  dark: "bg-nav text-white hover:brightness-125",
} as const;

const sizes = { sm: "h-8 px-3 text-sm", md: "h-10 px-4 text-[0.95rem]", lg: "h-12 px-6 text-base" } as const;

type Common = { variant?: keyof typeof variants; size?: keyof typeof sizes; className?: string };

export function buttonClass({ variant = "primary", size = "md", className }: Common = {}) {
  return cn(base, variants[variant], sizes[size], className);
}

export function Button({
  variant,
  size,
  className,
  loading,
  children,
  disabled,
  ...props
}: Common & { loading?: boolean } & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button className={buttonClass({ variant, size, className })} disabled={disabled || loading} aria-busy={loading || undefined} {...props}>
      {loading && <Loader2 className="size-4 animate-spin" aria-hidden />}
      {children}
    </button>
  );
}

export function LinkButton({
  variant,
  size,
  className,
  ...props
}: Common & React.ComponentProps<typeof Link>) {
  return <Link className={buttonClass({ variant, size, className })} {...props} />;
}
