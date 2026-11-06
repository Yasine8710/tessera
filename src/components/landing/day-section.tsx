import { Reveal } from "@/components/ui/reveal";
import { Figure, SectionLabel, Words } from "./editorial";
import { wrap } from "./layout";
import { ProductPreview } from "./product-preview";

/** The interface preview, set beside photography so it reads as part of the story, not a screenshot dump. */
export function DaySection() {
  return (
    <section aria-label="A day in Tessera"className="border-b border-line bg-surface2">
      <div className={`${wrap} py-[var(--space-section)]`}>
        <SectionLabel n="02">A day in Tessera</SectionLabel>
        <div className="mt-10 grid gap-12 lg:grid-cols-12 lg:items-start lg:gap-14">
          <div className="lg:col-span-5">
            <Words as="h2" className="display-lg" text="Doses, routines and progress in one calm view." />
            <Reveal delay={0.1}>
              <p className="lede mt-5 max-w-md">
                Each dose appears at its time. Mark it taken and the schedule and the care-team view update together.
              </p>
            </Reveal>
            <Figure name="meds-table" sizes="(min-width: 1024px) 40vw, 100vw" focal="50% 55%" className="mt-10 aspect-[3/2] w-full" />
          </div>
          <Reveal delay={0.08} className="lg:col-span-7 lg:pt-4">
            <ProductPreview />
          </Reveal>
        </div>
      </div>
    </section>
  );
}

/** Full-bleed photograph with one short statement set on a solid panel, so contrast never depends on the image. */
export function StatementBand() {
  return (
    <section aria-label="Our principle" className="relative isolate flex min-h-[26rem] items-end overflow-hidden border-b border-line sm:min-h-[32rem] lg:min-h-[38rem]">
      <Figure name="consult-smile" sizes="100vw" focal="50% 35%" className="absolute inset-0 -z-10" />
      <div className={`${wrap} pb-8 sm:pb-12 lg:pb-16`}>
        <div className="max-w-xl bg-nav p-6 text-nav-ink sm:p-10">
          <p className="text-xs font-semibold uppercase tracking-[0.14em]">Consent first</p>
          <Words as="p" className="mt-4 text-2xl font-semibold leading-tight tracking-tight sm:text-4xl" text="Sharing is the patient's decision. Staff see only what is switched on." />
        </div>
      </div>
    </section>
  );
}
