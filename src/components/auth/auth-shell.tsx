import Link from "next/link";
import { Logo } from "@/components/logo";
import { ThemeToggle } from "@/components/theme";
import { Figure, Rule, Words } from "@/components/landing/editorial";
import type { PhotoName } from "@/lib/photos";
import { cn } from "@/lib/cn";

const POINTS = [
  "Medications and routines in one daily view",
  "Sharing is off until you switch a category on",
  "Appointments and messages with your care team",
  "Every access to a record is logged",
];

/**
 * Two-pane frame shared by all authentication and invitation pages: a photograph and the product
 * promise on the left (large screens), the task on the right. `photo` and `focal` pick the picture.
 */
export function AuthShell({
  title,
  description,
  children,
  footer,
  wide,
  photo = "consult-smile",
  focal = "50% 40%",
}: {
  title: string;
  description?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  wide?: boolean;
  photo?: PhotoName;
  focal?: string;
}) {
  return (
    <div className="grid min-h-dvh lg:grid-cols-[minmax(24rem,0.85fr)_1.15fr]">
      <aside aria-label="About Tessera" className="hidden flex-col border-r border-line bg-surface lg:sticky lg:top-0 lg:flex lg:h-dvh">
        <div className="px-10 py-5">
          <Logo />
        </div>
        <Figure name={photo} focal={focal} sizes="(min-width: 1024px) 45vw, 0px" parallax={false} kenburns immediate className="min-h-[9rem] flex-1" />
        <div className="px-10 pb-6 pt-7">
          <p className="max-w-md text-2xl font-semibold leading-snug tracking-tight">Connected care, shared only with consent.</p>
          <ul className="stagger mt-5 max-w-md">
            {POINTS.map((p) => (
              <li key={p} className="flex items-start gap-3 border-t border-line py-2 text-sm text-ink2 last:border-b">
                <span className="mt-[0.6rem] h-px w-4 shrink-0 bg-accent" aria-hidden />
                {p}
              </li>
            ))}
          </ul>
          <p className="mt-4 max-w-md text-xs text-muted">Tessera is not an emergency service. In an emergency, contact your local emergency number.</p>
        </div>
      </aside>

      <div className="flex min-w-0 flex-col">
        <header className="flex items-center justify-between gap-3 px-4 py-4 sm:px-8 lg:px-12">
          <Logo className="lg:invisible" />
          <div className="flex items-center gap-2">
            <Link
              href="/"
              className="relative py-1 text-sm text-ink2 after:absolute after:inset-x-0 after:-bottom-0.5 after:h-px after:origin-left after:scale-x-0 after:bg-current after:transition-transform after:duration-300 hover:text-ink hover:after:scale-x-100"
            >
              Back to site
            </Link>
            <ThemeToggle />
          </div>
        </header>
        <Figure name={photo} focal={focal} sizes="100vw" parallax={false} immediate className="mx-4 h-28 shrink-0 sm:mx-8 sm:h-40 lg:hidden" />
        <main id="main" className="w-full flex-1 px-4 pb-16 pt-8 sm:px-8 lg:flex lg:flex-col lg:justify-center lg:px-12 lg:pt-4">
          <div className={cn("mx-auto w-full", wide ? "max-w-xl" : "max-w-md")}>
            <div className="anim-fade flex items-center gap-4">
              <Rule className="w-10" />
              <span className="eyebrow">Tessera</span>
            </div>
            <Words as="h1" immediate className="mt-4 text-3xl font-semibold leading-[1.05] tracking-[-0.025em] sm:text-4xl" text={title} />
            {description && (
              <div className="anim-up mt-3 text-muted" style={{ animationDelay: "200ms" }}>
                {description}
              </div>
            )}
            <div className="anim-up mt-8" style={{ animationDelay: "260ms" }}>
              {children}
            </div>
            {footer && (
              <div className="anim-up mt-8 border-t border-line pt-5 text-sm text-ink2" style={{ animationDelay: "320ms" }}>
                {footer}
              </div>
            )}
          </div>
        </main>
        <footer className="border-t border-line px-4 py-5 text-center text-xs text-muted lg:hidden">
          Tessera is not an emergency service. In an emergency, contact your local emergency number.
        </footer>
      </div>
    </div>
  );
}
