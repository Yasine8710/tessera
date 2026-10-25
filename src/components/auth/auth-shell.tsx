import Link from "next/link";
import { Logo } from "@/components/logo";
import { cn } from "@/lib/cn";

/** Centered, minimal frame shared by all authentication and invitation pages. */
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
    <div className="flex min-h-dvh flex-col">
      <header className="mx-auto flex w-full max-w-5xl items-center justify-between px-4 py-5 sm:px-6">
        <Logo />
        <Link href="/" className="text-sm text-ink2 hover:text-ink hover:underline">
          Back to site
        </Link>
      </header>
      <main id="main" className="mx-auto w-full flex-1 px-4 pb-16 pt-4 sm:px-6">
        <div className={cn("mx-auto w-full", wide ? "max-w-xl" : "max-w-md")}>
          <h1 className="text-2xl font-semibold sm:text-[1.75rem]">{title}</h1>
          {description && <div className="mt-2 text-muted">{description}</div>}
          <div className="mt-6">{children}</div>
          {footer && <div className="mt-6 text-sm text-ink2">{footer}</div>}
        </div>
      </main>
      <footer className="border-t border-line px-4 py-5 text-center text-xs text-muted">
        CareSync is not an emergency service. In an emergency, contact your local emergency number.
      </footer>
    </div>
  );
}
