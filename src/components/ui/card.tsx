import { AlertTriangle, CheckCircle2, Info, XCircle } from "lucide-react";
import { CountUp } from "./count-up";
import { Photo } from "./photo";
import type { PhotoName } from "@/lib/photos";
import { cn } from "@/lib/cn";

/** Hairline-bordered surface. No drop shadow: depth comes from the rule and the page background. */
export function Card({ className, ...p }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("rounded-md border border-line bg-surface", className)} {...p} />;
}

export function CardHeader({ title, action, description }: { title: string; action?: React.ReactNode; description?: string }) {
  return (
    <div className="flex items-start justify-between gap-3 border-b border-line px-5 py-4">
      <div>
        <h2 className="text-[0.95rem] font-semibold tracking-tight">{title}</h2>
        {description && <p className="mt-0.5 text-sm text-muted">{description}</p>}
      </div>
      {action}
    </div>
  );
}

const tones = {
  neutral: "bg-surface2 text-ink2",
  accent: "bg-accent-soft text-accent",
  ok: "bg-ok-soft text-ok",
  warn: "bg-warn-soft text-warn",
  danger: "bg-danger-soft text-danger",
  info: "bg-info-soft text-info",
} as const;
export type Tone = keyof typeof tones;

export function Badge({ tone = "neutral", className, ...p }: { tone?: Tone } & React.HTMLAttributes<HTMLSpanElement>) {
  return <span className={cn("inline-flex items-center rounded-sm px-1.5 py-0.5 text-xs font-semibold tracking-wide transition-colors", tones[tone], className)} {...p} />;
}

const alertIcon = { info: Info, ok: CheckCircle2, warn: AlertTriangle, danger: XCircle } as const;
/** A tinted note with a hairline border in its tone colour. */
export function Alert({ tone = "info", title, children, className }: { tone?: "info" | "ok" | "warn" | "danger"; title?: string; children?: React.ReactNode; className?: string }) {
  const Icon = alertIcon[tone];
  return (
    <div role={tone === "danger" ? "alert" : "status"} className={cn("anim-up flex gap-3 rounded-sm border border-current/25 px-4 py-3 text-sm", tones[tone], className)}>
      <Icon className="mt-0.5 size-4 shrink-0" aria-hidden />
      <div>
        {title && <p className="font-semibold">{title}</p>}
        {children && <div className={title ? "mt-0.5" : ""}>{children}</div>}
      </div>
    </div>
  );
}

export function EmptyState({
  icon: Icon,
  title,
  children,
  action,
  photo,
}: {
  icon?: React.ComponentType<{ className?: string }>;
  title: string;
  children?: React.ReactNode;
  action?: React.ReactNode;
  photo?: PhotoName;
}) {
  if (photo) {
    return (
      <div className="group anim-up grid items-stretch gap-0 overflow-hidden sm:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
        <Photo name={photo} className="mask-right h-44 sm:h-auto sm:min-h-60" sizes="(min-width: 640px) 30vw, 100vw" />
        <div className="flex flex-col justify-center px-6 py-8 sm:px-10">
          <span aria-hidden className="anim-grow-x mb-4 block h-px w-10 bg-accent" />
          <p className="text-xl font-semibold tracking-tight">{title}</p>
          {children && <p className="mt-2 max-w-md text-ink2">{children}</p>}
          {action && <div className="mt-6">{action}</div>}
        </div>
      </div>
    );
  }
  return (
    <div className="anim-up flex flex-col items-center px-6 py-12 text-center">
      {Icon && <Icon className="mb-3 size-7 text-muted" />}
      <p className="font-semibold tracking-tight">{title}</p>
      {children && <p className="mt-1 max-w-sm text-sm text-muted">{children}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("skeleton h-4 w-full rounded-sm", className)} aria-hidden />;
}

/** Big numeral under an eyebrow label and a rule. Numbers count up on first render. */
export function Stat({ label, value, hint, tone }: { label: string; value: React.ReactNode; hint?: string; tone?: Tone }) {
  return (
    <div className="anim-up">
      <span aria-hidden className="anim-grow-x block h-px bg-line2" />
      <p className="eyebrow mt-3">{label}</p>
      <p className="mt-2 text-4xl font-semibold leading-none tracking-tight tabular-nums sm:text-5xl">{typeof value === "number" ? <CountUp value={value} /> : value}</p>
      {hint && <p className={cn("mt-2 text-sm", tone ? tones[tone].split(" ")[1] : "text-muted")}>{hint}</p>}
    </div>
  );
}

/**
 * Eyebrow + large title + hairline rule that draws in. `eyebrow` is optional (additive).
 * `photo` adds a wide image strip under the title: used on portal home pages to fill the space.
 */
export function PageHeader({
  title,
  description,
  action,
  photo,
  focal,
  eyebrow,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
  photo?: PhotoName;
  focal?: string;
  eyebrow?: string;
}) {
  return (
    <div className="mb-8">
      <div className="anim-up flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
        <div>
          {eyebrow && <p className="eyebrow mb-2">{eyebrow}</p>}
          <h1 className="text-3xl font-semibold leading-[1.1] tracking-tight sm:text-4xl">{title}</h1>
          {description && <p className="mt-2.5 max-w-2xl text-base text-ink2">{description}</p>}
        </div>
        {action}
      </div>
      <span aria-hidden className="anim-grow-x mt-5 block h-px bg-line2" style={{ animationDelay: "120ms" }} />
      {photo && (
        <div className="group mask-right mt-6 overflow-hidden rounded-md" style={{ animationDelay: "160ms" }}>
          <Photo name={photo} focal={focal} className="h-36 sm:h-44 lg:h-56" sizes="(min-width: 1024px) 70vw, 100vw" />
        </div>
      )}
    </div>
  );
}
