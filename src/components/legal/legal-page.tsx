import { SiteFooter } from "@/components/landing/site-footer";
import { SiteHeader } from "@/components/landing/site-header";
import { Reveal } from "@/components/ui/reveal";

export function LegalPage({ title, updated, intro, children }: { title: string; updated: string; intro: string; children: React.ReactNode }) {
  return (
    <>
      <SiteHeader />
      <main id="main">
        <div className="border-b border-line bg-surface2">
          <div className="stagger mx-auto max-w-5xl px-4 py-12 sm:px-6 sm:py-16">
            <h1 className="text-3xl font-semibold sm:text-4xl">{title}</h1>
            <p className="mt-2 text-sm text-muted">Last updated {updated}</p>
            <p className="mt-6 max-w-3xl text-lg text-ink2">{intro}</p>
          </div>
        </div>
        <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 sm:py-14 [counter-reset:sec]">{children}</div>
      </main>
      <SiteFooter />
    </>
  );
}

/** Numbered two-column row: title on the left, text on the right. */
export function LegalSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="border-t border-line py-8 first:border-t-0 first:pt-0 [counter-increment:sec]">
      <Reveal className="grid gap-3 md:grid-cols-[14rem_1fr] md:gap-10">
        <h2 className="text-lg font-semibold before:mb-1 before:block before:text-sm before:font-medium before:tabular-nums before:text-muted before:content-[counter(sec,decimal-leading-zero)]">
          {title}
        </h2>
        <div className="max-w-2xl space-y-3 text-ink2 [&_li]:ml-5 [&_li]:list-disc [&_ul]:space-y-1.5">{children}</div>
      </Reveal>
    </section>
  );
}
