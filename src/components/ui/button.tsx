import Link from "next/link";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/cn";

const base =
  "inline-flex items-center justify-center gap-2 rounded-md font-medium whitespace-nowrap press select-none disabled:cursor-not-allowed disabled:opacity-55 disabled:active:scale-100";

const variants = {
  primary: "bg-accent text-onaccent hover:bg-accent-hover",
  secondary: "bg-transparent text-ink border border-line2 hover:bg-surface2 hover:border-ink/40",
  ghost: "text-ink2 hover:bg-surface2 hover:text-ink",
  danger: "bg-danger text-onaccent hover:brightness-110",
  dark: "bg-nav text-nav-ink hover:brightness-125",
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
