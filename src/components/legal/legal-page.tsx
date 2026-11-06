import { SiteFooter } from "@/components/landing/site-footer";
import { SiteHeader } from "@/components/landing/site-header";
import { Figure, Words } from "@/components/landing/editorial";
import { wrap } from "@/components/landing/layout";
import { Reveal } from "@/components/ui/reveal";
import type { PhotoName } from "@/lib/photos";

export function LegalPage({
  title,
  updated,
  intro,
  children,
  photo = "consult-smile",
  focal = "50% 40%",
}: {
  title: string;
  updated: string;
  intro: string;
  children: React.ReactNode;
  photo?: PhotoName;
  focal?: string;
}) {
  return (
    <>
      <SiteHeader />
      <main id="main">
        <div className="border-b border-line">
          <div className={`${wrap} grid gap-10 py-12 sm:py-16 lg:grid-cols-12 lg:items-end lg:gap-14 lg:py-20`}>
            <div className="lg:col-span-7">
              <p className="eyebrow anim-fade">Last updated {updated}</p>
              <Words as="h1" immediate className="mt-5 text-[clamp(2.6rem,7vw,5.5rem)] font-semibold leading-[1] tracking-[-0.035em]" text={title} />
              <p className="lede anim-up mt-6 max-w-2xl" style={{ animationDelay: "300ms" }}>
                {intro}
              </p>
            </div>
            <Figure name={photo} focal={focal} immediate sizes="(min-width: 1024px) 40vw, 100vw" className="aspect-[3/2] w-full lg:col-span-5" />
          </div>
        </div>
        <div className={`${wrap} py-10 sm:py-14 [counter-reset:sec]`}>{children}</div>
      </main>
      <SiteFooter />
    </>
  );
}

/** Numbered two-column row: big numeral and title on the left, text on the right. */
export function LegalSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="border-t border-line py-9 first:border-t-0 first:pt-0 [counter-increment:sec]">
      <Reveal className="grid gap-4 md:grid-cols-[18rem_1fr] md:gap-14">
        <h2 className="text-xl font-semibold tracking-tight before:mb-2 before:block before:text-4xl before:font-light before:tabular-nums before:text-muted before:content-[counter(sec,decimal-leading-zero)]">
          {title}
        </h2>
        <div className="max-w-2xl space-y-3 text-ink2 [&_li]:ml-5 [&_li]:list-disc [&_ul]:space-y-1.5">{children}</div>
      </Reveal>
    </section>
  );
}
