import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { LinkButton } from "@/components/ui/button";
import { CountUp, Figure, Rule, Words } from "./editorial";
import { wrap } from "./layout";

const STATS = [
  { n: 3, label: "Roles: patient, professional, administrator" },
  { n: 4, label: "Data categories a patient controls" },
  { n: 5, label: "Steps from sign-up to shared follow-up" },
  { n: 7, label: "Practical tools, no extras" },
];

export function Hero() {
  return (
    <section className="border-b border-line">
      <div className={`${wrap} pt-10 sm:pt-14 lg:pt-20`}>
        <div className="anim-fade flex items-center gap-4">
          <Rule className="w-12 sm:w-20" />
          <p className="eyebrow">Medication, routines and follow-up in one place</p>
        </div>
        <Words
          as="h1"
          immediate
          text="Better care starts with staying connected."
          className="mt-6 max-w-5xl text-[clamp(2.6rem,8.2vw,7rem)] font-semibold leading-[0.98] tracking-[-0.035em]"
        />

        <div className="mt-10 grid gap-10 lg:mt-14 lg:grid-cols-12 lg:gap-14">
          <div className="lg:col-span-4 lg:pt-1">
            <p className="lede anim-up" style={{ animationDelay: "500ms" }}>
              Tessera helps patients stay on top of their medications and daily routines while giving healthcare professionals a clearer picture of patient progress and follow-up needs.
            </p>
            <div className="anim-up mt-8 flex flex-wrap items-center gap-x-6 gap-y-3" style={{ animationDelay: "600ms" }}>
              <LinkButton href="/register" size="lg" className="group">
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
            <p className="anim-up mt-10 border-t border-line pt-5 text-sm text-muted" style={{ animationDelay: "700ms" }}>
              Tessera is not an emergency service. If you may be having a medical emergency, contact your local emergency number immediately.
            </p>
          </div>
          <div className="lg:col-span-8">
            <Figure
              name="hero-consultation"
              alt="A doctor sits with an older patient and talks through a plan, both looking at a document together."
              immediate
              priority
              sizes="(min-width: 1280px) 800px, (min-width: 1024px) 62vw, 100vw"
              focal="50% 40%"
              className="aspect-[4/3] sm:aspect-[16/10] lg:aspect-[16/9]"
            />
          </div>
        </div>
      </div>

      <dl className={`${wrap} mt-12 grid grid-cols-2 border-t border-line sm:grid-cols-4 lg:mt-16`}>
        {STATS.map((s, i) => (
          <div key={s.label} className={`flex flex-col-reverse justify-end py-6 pr-4 sm:py-8 ${i % 2 === 1 ? "border-l border-line pl-4 sm:pl-6" : ""} ${i > 0 ? "sm:border-l sm:border-line sm:pl-6" : ""} ${i > 1 ? "border-t border-line sm:border-t-0" : ""}`}>
            <dt className="mt-2 max-w-[16rem] text-sm text-muted">{s.label}</dt>
            <dd className="text-5xl font-light tracking-tight text-ink sm:text-6xl">
              <CountUp to={s.n} />
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
