import { Photo } from "@/components/ui/photo";
import type { PhotoName } from "@/lib/photos";
import { cn } from "@/lib/cn";
import { CountUp } from "./count-up";

/**
 * Editorial frame for the clinician workspace: eyebrow, large title, lede, and an optional photograph
 * that wipes open beside the text on wide screens. Replaces PageHeader on staff pages.
 */
export function Masthead({
  eyebrow,
  title,
  description,
  action,
  photo,
  focal,
}: {
  eyebrow: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
  photo?: PhotoName;
  focal?: string;
}) {
  return (
    <header className={cn("mb-8 grid gap-6 border-b border-line pb-8", photo && "lg:grid-cols-[minmax(0,1fr)_minmax(0,26rem)] lg:gap-10 xl:grid-cols-[minmax(0,1fr)_minmax(0,36rem)]")}>
      <div className="flex flex-col justify-end">
        <p className="eyebrow anim-up">{eyebrow}</p>
        <h1 className="display-lg anim-up mt-2" style={{ animationDelay: "60ms" }}>{title}</h1>
        {description && <p className="lede anim-up mt-3 max-w-2xl" style={{ animationDelay: "120ms" }}>{description}</p>}
        {action && <div className="anim-up mt-5" style={{ animationDelay: "180ms" }}>{action}</div>}
      </div>
      {photo && (
        <div className="group mask-up kenburns overflow-hidden rounded-lg lg:h-full">
          <Photo name={photo} focal={focal} priority className="h-44 sm:h-52 lg:h-full lg:min-h-56" sizes="(min-width: 1280px) 36rem, (min-width: 1024px) 26rem, 100vw" />
        </div>
      )}
    </header>
  );
}

/** A section with a heavy hairline on top and an eyebrow-scale heading. Keeps a real h2. */
export function Panel({
  title,
  description,
  action,
  children,
  className,
  delay = 0,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  return (
    <section className={cn("anim-up", className)} style={{ animationDelay: `${delay}ms` }}>
      <div className="flex items-end justify-between gap-3 border-t-2 border-ink pt-3">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">{title}</h2>
          {description && <p className="mt-1 max-w-prose text-sm text-muted">{description}</p>}
        </div>
        {action}
      </div>
      <div className="mt-3">{children}</div>
    </section>
  );
}

const TONE_TEXT = { warn: "text-warn", info: "text-info", danger: "text-danger", ok: "text-ok", accent: "text-accent" } as const;

/** Big numeral with an eyebrow label above and a short hint below, set on a hairline. */
export function Figure({
  label,
  value,
  hint,
  tone,
  size = "lg",
  children,
}: {
  label: string;
  value: React.ReactNode;
  hint?: string;
  tone?: keyof typeof TONE_TEXT;
  size?: "lg" | "sm";
  children?: React.ReactNode;
}) {
  return (
    <div className="border-t border-line2 pt-3">
      <p className="eyebrow">{label}</p>
      <p className={cn("mt-1.5 font-semibold leading-none tracking-tight tabular-nums", size === "lg" ? "text-5xl xl:text-6xl" : "text-3xl", tone && TONE_TEXT[tone])}>
        {typeof value === "number" ? <CountUp value={value} /> : value}
      </p>
      {children}
      {hint && <p className={cn("mt-2 text-sm", tone ? TONE_TEXT[tone] : "text-muted")}>{hint}</p>}
    </div>
  );
}
