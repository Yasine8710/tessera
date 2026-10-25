import { Audiences } from "@/components/landing/audiences";
import { Faq } from "@/components/landing/faq";
import { Features } from "@/components/landing/features";
import { Hero } from "@/components/landing/hero";
import { HowItWorks } from "@/components/landing/how-it-works";
import { SiteFooter } from "@/components/landing/site-footer";
import { SiteHeader } from "@/components/landing/site-header";
import { Trust } from "@/components/landing/trust";

export default function LandingPage() {
  return (
    <>
      <SiteHeader />
      <main id="main">
        <Hero />
        <HowItWorks />
        <Audiences />
        <Features />
        <Trust />
        <Faq />
      </main>
      <SiteFooter />
    </>
  );
}
