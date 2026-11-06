import { Photo } from "@/components/ui/photo";
import type { PhotoName } from "@/lib/photos";
import { cn } from "@/lib/cn";

/** Hairline-ruled editorial section: numbered eyebrow, title, optional description and action. */
export function Section({
  n,
  title,
  description,
  action,
  children,
  className,
  id,
}: {
  n?: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
  id?: string;
}) {
  return (
    <section aria-labelledby={id} className={cn("anim-up", className)}>
      <header className="flex items-start justify-between gap-4 border-t border-ink pt-3">
        <div className="flex gap-4">
          {n && (
            <span className="eyebrow pt-1.5 tabular-nums" aria-hidden>
              {n}
            </span>
          )}
          <div>
            <h2 id={id} className="text-xl font-semibold tracking-tight">
              {title}
            </h2>
            {description && <p className="mt-1 max-w-xl text-sm text-muted">{description}</p>}
          </div>
        </div>
        {action}
      </header>
      <div className="mt-3">{children}</div>
    </section>
  );
}

/** A big numeral with a small label under it. */
export function Numeral({ children, label, className }: { children: React.ReactNode; label: string; className?: string }) {
  return (
    <div className={cn("min-w-0", className)}>
      <p className="text-5xl font-semibold leading-none tracking-tight tabular-nums sm:text-6xl">{children}</p>
      <p className="eyebrow mt-3">{label}</p>
    </div>
  );
}

/** Quiet decorative photo in a rule-bordered frame; curtain reveal on first view. */
export function Plate({ name, focal, className, caption }: { name: PhotoName; focal?: string; className?: string; caption?: string }) {
  return (
    <figure className={cn("group", className)}>
      <div className="mask-up overflow-hidden rounded-sm">
        <Photo name={name} focal={focal} className="kenburns h-full min-h-48 w-full" sizes="(min-width: 1024px) 35vw, 100vw" />
      </div>
      {caption && <figcaption className="eyebrow mt-2">{caption}</figcaption>}
    </figure>
  );
}

/** Page title block: eyebrow, large title, lede. Photo strip optional. Keeps a single h1. */
export function EditorialHeader({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <header className="anim-up mb-8 flex flex-wrap items-end justify-between gap-4">
      <div>
        {eyebrow && <p className="eyebrow mb-2">{eyebrow}</p>}
        <h1 className="display-lg">{title}</h1>
        {description && <p className="lede mt-3 max-w-2xl">{description}</p>}
      </div>
      {action}
    </header>
  );
}
