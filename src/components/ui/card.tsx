import { AlertTriangle, CheckCircle2, Info, XCircle } from "lucide-react";
import { Photo } from "./photo";
import type { PhotoName } from "@/lib/photos";
import { cn } from "@/lib/cn";

export function Card({ className, ...p }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("rounded-lg border border-line bg-surface shadow-sm", className)} {...p} />;
}

export function CardHeader({ title, action, description }: { title: string; action?: React.ReactNode; description?: string }) {
  return (
    <div className="flex items-start justify-between gap-3 border-b border-line px-5 py-3.5">
      <div>
        <h2 className="text-base font-semibold">{title}</h2>
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
  return <span className={cn("inline-flex items-center rounded-sm px-2 py-0.5 text-xs font-semibold transition-colors", tones[tone], className)} {...p} />;
}

const alertIcon = { info: Info, ok: CheckCircle2, warn: AlertTriangle, danger: XCircle } as const;
export function Alert({ tone = "info", title, children, className }: { tone?: "info" | "ok" | "warn" | "danger"; title?: string; children?: React.ReactNode; className?: string }) {
  const Icon = alertIcon[tone];
  return (
    <div role={tone === "danger" ? "alert" : "status"} className={cn("anim-up flex gap-3 rounded-md border border-current/15 px-4 py-3 text-sm", tones[tone], className)}>
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
        <Photo name={photo} className="h-44 sm:h-auto sm:min-h-56" sizes="(min-width: 640px) 30vw, 100vw" />
        <div className="flex flex-col justify-center px-6 py-8 sm:px-8">
          <p className="text-lg font-semibold">{title}</p>
          {children && <p className="mt-1.5 max-w-md text-muted">{children}</p>}
          {action && <div className="mt-5">{action}</div>}
        </div>
      </div>
    );
  }
  return (
    <div className="anim-up flex flex-col items-center px-6 py-10 text-center">
      {Icon && <Icon className="mb-3 size-8 text-muted" />}
      <p className="font-semibold">{title}</p>
      {children && <p className="mt-1 max-w-sm text-sm text-muted">{children}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("h-4 w-full animate-pulse rounded-sm bg-surface2", className)} aria-hidden />;
}

export function Stat({ label, value, hint, tone }: { label: string; value: React.ReactNode; hint?: string; tone?: Tone }) {
  return (
    <Card className="px-5 py-4">
      <p className="text-sm text-muted">{label}</p>
      <p className="mt-1 text-3xl font-semibold tabular-nums">{value}</p>
      {hint && <p className={cn("mt-1 text-sm", tone ? tones[tone].split(" ")[1] : "text-muted")}>{hint}</p>}
    </Card>
  );
}

/** `photo` adds a wide image strip under the title: used on portal home pages to fill the space. */
export function PageHeader({
  title,
  description,
  action,
  photo,
  focal,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
  photo?: PhotoName;
  focal?: string;
}) {
  return (
    <div className="mb-6">
      <div className="anim-up flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold sm:text-[1.75rem]">{title}</h1>
          {description && <p className="mt-1 max-w-2xl text-muted">{description}</p>}
        </div>
        {action}
      </div>
      {photo && (
        <div className="group anim-up mt-5 overflow-hidden rounded-lg border border-line" style={{ animationDelay: "90ms" }}>
          <Photo name={photo} focal={focal} className="h-36 sm:h-44 lg:h-52" sizes="(min-width: 1024px) 70vw, 100vw" />
        </div>
      )}
    </div>
  );
}
