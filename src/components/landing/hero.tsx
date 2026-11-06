import Link from "next/link";
import { ArrowRight, ShieldCheck } from "lucide-react";
import { LinkButton } from "@/components/ui/button";
import { ProductPreview } from "./product-preview";

const FACTS = [
  { k: "Cost", v: "Free, no ads" },
  { k: "Sharing", v: "Off until you allow it" },
  { k: "Access", v: "Only connected staff" },
  { k: "Record", v: "Audit trail kept" },
];

export function Hero() {
  return (
    <section className="border-b border-line">
      <div className="mx-auto grid max-w-6xl gap-12 px-4 pb-12 pt-12 sm:px-6 lg:grid-cols-[1fr_1.08fr] lg:items-center lg:gap-14 lg:pb-16 lg:pt-16">
        <div className="stagger">
          <p className="text-sm font-medium text-accent">Medication, routines and follow-up in one place</p>
          <h1 className="mt-3 text-4xl font-semibold sm:text-5xl">Better care starts with staying connected.</h1>
          <p className="mt-5 max-w-xl text-lg text-ink2">
            Tessera helps patients stay on top of their medications and daily routines while giving healthcare professionals a clearer picture of patient progress and follow-up needs.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3">
            <LinkButton href="/register" size="lg" className="group press">
              Get Started — Free
              <ArrowRight className="size-4 transition-transform duration-200 group-hover:translate-x-1" aria-hidden />
            </LinkButton>
            <Link
              href="#how-it-works"
              className="relative py-1 font-medium text-ink after:absolute after:inset-x-0 after:-bottom-0.5 after:h-0.5 after:origin-left after:bg-accent after:transition-transform after:duration-300 hover:after:scale-x-[0.35]"
            >
              Explore How It Works
            </Link>
          </div>
          <p className="mt-8 flex max-w-xl items-start gap-2.5 border-t border-line pt-5 text-sm text-muted">
            <ShieldCheck className="mt-0.5 size-4 shrink-0 text-accent" aria-hidden />
            <span>Tessera is not an emergency service. If you may be having a medical emergency, contact your local emergency number immediately.</span>
          </p>
        </div>
        <div className="anim-right" style={{ animationDelay: "160ms" }}>
          <ProductPreview />
        </div>
      </div>

      <dl className="mx-auto grid max-w-6xl grid-cols-2 border-t border-line sm:grid-cols-4">
        {FACTS.map((f, i) => (
          <div key={f.k} className={`anim-up px-4 py-4 sm:px-6 ${i % 2 === 1 ? "border-l border-line" : ""} ${i > 0 ? "sm:border-l sm:border-line" : ""} ${i > 1 ? "border-t border-line sm:border-t-0" : ""}`} style={{ animationDelay: `${300 + i * 70}ms` }}>
            <dt className="text-xs text-muted">{f.k}</dt>
            <dd className="mt-0.5 text-sm font-medium">{f.v}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
