import Link from "next/link";
import { Logo } from "@/components/logo";
import { ThemeToggle } from "@/components/theme";
import { cn } from "@/lib/cn";

const POINTS = [
  "Medications and routines in one daily view",
  "Sharing is off until you switch a category on",
  "Appointments and messages with your care team",
  "Every access to a record is logged",
];

/** Two-pane frame shared by all authentication and invitation pages: product context left, task right. */
export function AuthShell({
  title,
  description,
  children,
  footer,
  wide,
}: {
  title: string;
  description?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  wide?: boolean;
}) {
  return (
    <div className="grid min-h-dvh lg:grid-cols-[minmax(20rem,0.8fr)_1.2fr]">
      <aside aria-label="About Tessera" className="hidden flex-col justify-between border-r border-line bg-surface2 px-10 py-8 lg:flex">
        <Logo />
        <div className="stagger max-w-sm">
          <p className="text-2xl font-semibold leading-snug">Connected care, shared only with consent.</p>
          <ul className="mt-6 divide-y divide-line border-y border-line">
            {POINTS.map((p) => (
              <li key={p} className="flex items-start gap-3 py-3 text-sm text-ink2">
                <span className="mt-1.5 size-1.5 shrink-0 rounded-[1px] bg-accent" aria-hidden />
                {p}
              </li>
            ))}
          </ul>
        </div>
        <p className="max-w-sm text-xs text-muted">Tessera is not an emergency service. In an emergency, contact your local emergency number.</p>
      </aside>

      <div className="flex min-w-0 flex-col">
        <header className="flex items-center justify-between gap-3 px-4 py-4 sm:px-8">
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
        <main id="main" className="w-full flex-1 px-4 pb-16 pt-6 sm:px-8 lg:pt-10">
          <div className={cn("mx-auto w-full", wide ? "max-w-xl" : "max-w-md")}>
            <h1 className="anim-up text-2xl font-semibold sm:text-[1.75rem]">{title}</h1>
            {description && (
              <div className="anim-up mt-2 text-muted" style={{ animationDelay: "60ms" }}>
                {description}
              </div>
            )}
            <div className="anim-up mt-6" style={{ animationDelay: "120ms" }}>
              {children}
            </div>
            {footer && (
              <div className="anim-up mt-6 border-t border-line pt-5 text-sm text-ink2" style={{ animationDelay: "180ms" }}>
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
