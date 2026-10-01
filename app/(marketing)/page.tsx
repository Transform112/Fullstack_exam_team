import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { SAMPLE_WISH } from "@/lib/sample-data";
import { Button } from "@/components/ui/button";
import { LandingNav } from "@/components/app/LandingNav";
import { HeroPhone } from "@/components/app/landing/HeroPhone";
import { HowItWorks } from "@/components/app/landing/HowItWorks";
import { TemplateShowcase } from "@/components/app/landing/TemplateShowcase";
import { SamplePages } from "@/components/app/landing/SamplePages";
import { Testimonials } from "@/components/app/landing/Testimonials";
import { Faq } from "@/components/app/landing/Faq";
import { CtaBand } from "@/components/app/landing/CtaBand";
import { SiteFooter } from "@/components/app/landing/SiteFooter";

// Landing page (docs/04 SECTION 8). Server component: it reads the session for the
// navbar and renders the animated pieces as client islands. The copy is fixed in
// the recipe, so it stays out of the client bundles.
export default async function LandingPage() {
  const user = await getCurrentUser();
  const sample = SAMPLE_WISH("neon-night", "HINGLISH");

  return (
    <>
      <LandingNav loggedIn={!!user} />

      <main>
        {/* 2. Hero: text on the left, the self-scrolling phone on the right. */}
        <section className="relative overflow-hidden">
          <div
            aria-hidden
            className="pointer-events-none absolute -left-24 top-10 h-72 w-72 rounded-full bg-primary/25 blur-[80px]"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute right-0 top-40 h-80 w-80 rounded-full bg-accent/25 blur-[80px]"
          />

          <div className="container-page relative grid items-center gap-12 py-14 sm:py-20 lg:grid-cols-2 lg:gap-8">
            <div className="text-center lg:text-left">
              <h1 className="text-[clamp(36px,7vw,68px)] font-bold leading-[1.05] text-ink">
                Turn a few photos and a few words into a surprise they will never forget.
              </h1>
              <p className="mx-auto mt-5 max-w-xl text-base text-muted sm:text-lg lg:mx-0">
                Fill a short form, upload your photos and get an animated website with its own link.
                Share it on WhatsApp in a minute.
              </p>
              <div className="mt-8 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center lg:justify-start">
                <Button asChild size="lg">
                  <Link href="/signup">Create a surprise</Link>
                </Button>
                <Button asChild size="lg" variant="outline">
                  <Link href="/w/riya-birthday-7f3a">See a sample</Link>
                </Button>
              </div>
            </div>

            <HeroPhone data={sample} />
          </div>
        </section>

        <HowItWorks />
        <TemplateShowcase />
        <SamplePages />
        <Testimonials />
        <Faq />
        <CtaBand />
      </main>

      <SiteFooter />
    </>
  );
}
