import { ArrowRight, ShieldCheck } from "lucide-react";
import { LinkButton } from "@/components/ui/button";
import { Reveal } from "@/components/ui/reveal";
import { ProductPreview } from "./product-preview";

export function Hero() {
  return (
    <section className="border-b border-line">
      <div className="mx-auto grid max-w-6xl gap-12 px-4 py-14 sm:px-6 lg:grid-cols-[1fr_1.05fr] lg:items-center lg:py-20">
        <Reveal>
          <p className="text-sm font-semibold uppercase tracking-wide text-accent-hover">Connected care. Better everyday health.</p>
          <h1 className="mt-3 text-4xl font-semibold sm:text-5xl">Better care starts with staying connected.</h1>
          <p className="mt-5 max-w-xl text-lg text-ink2">
            Tessera helps patients stay on top of their medications and daily routines while giving healthcare professionals a clearer picture of patient progress and follow-up needs.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <LinkButton href="/register" size="lg">
              Get Started — Free
              <ArrowRight className="size-4" aria-hidden />
            </LinkButton>
            <LinkButton href="#how-it-works" size="lg" variant="secondary">
              Explore How It Works
            </LinkButton>
          </div>
          <p className="mt-6 flex items-start gap-2 text-sm text-muted">
            <ShieldCheck className="mt-0.5 size-4 shrink-0 text-accent" aria-hidden />
            <span>
              Tessera is not an emergency service. If you may be having a medical emergency, contact your local emergency number immediately.
            </span>
          </p>
        </Reveal>
        <Reveal delay={0.1}>
          <ProductPreview />
        </Reveal>
      </div>
    </section>
  );
}
