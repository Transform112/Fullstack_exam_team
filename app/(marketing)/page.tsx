import Link from "next/link";
import { ArrowRight, Heart, Check } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { LandingNav } from "@/components/app/LandingNav";
import { HowItWorks } from "@/components/app/landing/HowItWorks";
import { TemplateShowcase } from "@/components/app/landing/TemplateShowcase";
import { Faq } from "@/components/app/landing/Faq";
import { SiteFooter } from "@/components/app/landing/SiteFooter";
import { CelebrationCard } from "@/components/app/CelebrationCard";
import { PersonalNoteStudio } from "@/components/app/landing/PersonalNoteStudio";
import { Button } from "@/components/ui/button";
export default async function LandingPage() {
  const user = await getCurrentUser();
  return <>
    <LandingNav loggedIn={!!user} />
    <main id="main-content">
      <section className="studio-hero container-page">
        <div className="hero-copy">
          <p className="eyebrow">
            <span /> LITTLE PAGES. BIG FEELINGS.</p>
          <h1>For the people<br />who mean<br />
            <em>everything.</em>
          </h1>
          <p className="hero-description">Their favourite memories. Your heartfelt words.<br className="hidden sm:block" /> A beautiful surprise page, made just for them.</p>
          <div className="hero-actions">
            <Button asChild size="lg">
              <Link href={user ? "/create" : "/signup"}>Make someone’s day <ArrowRight size={17} />
              </Link>
            </Button>
            <Link className="text-link" href="#templates">Explore the collection <ArrowRight size={16} />
            </Link>
          </div>
          <p className="hero-note">
            <Check size={14} /> Made by you. No coding needed.</p>
        </div>
        <div className="hero-art">
          <div className="paper-behind" aria-hidden />
          <CelebrationCard />
          <span className="art-note">a little link,<br />a lot of love <Heart size={17} />
          </span>
          <span className="art-caption">A LITTLE PREVIEW OF THE POSSIBILITIES</span>
        </div>
      </section>
      <div className="occasion-strip">
        <div className="container-page">
          <span>THERE’S ALWAYS A REASON</span>
          <Link href="/occasions/birthday">Birthdays</Link>
          <span aria-hidden>✳</span>
          <Link href="/occasions/anniversary">Anniversaries</Link>
          <span aria-hidden>✳</span>
          <Link href="/occasions/custom">Just because</Link>
          <span aria-hidden>✳</span>
          <Link href="/occasions">Every little milestone</Link>
        </div>
      </div>
      <TemplateShowcase />
      <HowItWorks />
      <PersonalNoteStudio loggedIn={!!user} />
      <Faq />
      <section className="studio-cta container-page">
        <div>
          <p className="eyebrow">GO ON, MAKE IT PERSONAL</p>
          <h2>Someone’s about to<br />
            <em>feel very loved.</em>
          </h2>
        </div>
        <div>
          <p>You bring the memories.<br />We’ll help you make the moment.</p>
          <Button asChild size="lg">
            <Link href={user ? "/create" : "/signup"}>Create a surprise <ArrowRight size={17} />
            </Link>
          </Button>
        </div>
      </section>
    </main>
    <SiteFooter />
  </>;
}
