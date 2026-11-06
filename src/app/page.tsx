import { redirect } from "next/navigation";
import { isDesktop } from "@/server/desktop";
import { getSession, homeFor } from "@/server/session";
import { Audiences } from "@/components/landing/audiences";
import { Faq } from "@/components/landing/faq";
import { Features } from "@/components/landing/features";
import { Hero } from "@/components/landing/hero";
import { HowItWorks } from "@/components/landing/how-it-works";
import { SiteFooter } from "@/components/landing/site-footer";
import { SiteHeader } from "@/components/landing/site-header";
import { Trust } from "@/components/landing/trust";

// Desktop vs web behaviour is decided per request from the environment, so never prerender.
export const dynamic = "force-dynamic";

export default async function LandingPage() {
  if (isDesktop()) {
    const session = await getSession();
    redirect(session ? homeFor(session.role) : "/login");
  }
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
