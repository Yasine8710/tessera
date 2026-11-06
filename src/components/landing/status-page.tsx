import { Logo } from "@/components/logo";
import type { PhotoName } from "@/lib/photos";
import { CountUp, Figure, Rule, Words } from "./editorial";

/** Full-height split page for 404 and error states: words and actions on the left, a photograph on the right. */
export function StatusPage({
  code,
  eyebrow,
  title,
  alert,
  children,
  photo,
  focal,
}: {
  code?: number;
  eyebrow: string;
  title: string;
  alert?: boolean;
  children: React.ReactNode;
  photo: PhotoName;
  focal?: string;
}) {
  return (
    <div className="grid min-h-dvh lg:grid-cols-2">
      <main id="main" className="order-2 flex flex-col justify-between px-4 py-8 sm:px-10 lg:order-1 lg:px-16 lg:py-10">
        <Logo />
        <div className="py-14">
          {code !== undefined && (
            <p className="anim-fade text-[clamp(5rem,16vw,11rem)] font-light leading-none tracking-tighter text-muted" aria-hidden>
              <CountUp to={code} decorative />
            </p>
          )}
          <div className="mt-6 flex items-center gap-4">
            <Rule className="w-10" />
            <p className="eyebrow">{eyebrow}</p>
          </div>
          <Words as="h1" immediate className="mt-4 max-w-lg text-4xl font-semibold leading-[1.04] tracking-[-0.03em] sm:text-5xl" text={title} />
          <div className="anim-up mt-5 max-w-md text-ink2" style={{ animationDelay: "300ms" }} role={alert ? "alert" : undefined}>
            {children}
          </div>
        </div>
        <p className="text-xs text-muted">Tessera is not an emergency service. In an emergency, contact your local emergency number.</p>
      </main>
      <Figure name={photo} focal={focal} parallax={false} kenburns immediate sizes="(min-width: 1024px) 50vw, 100vw" className="order-1 h-48 sm:h-72 lg:order-2 lg:h-auto" />
    </div>
  );
}
