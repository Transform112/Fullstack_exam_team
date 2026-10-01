import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { LandingNav } from "@/components/app/LandingNav";
import { SiteFooter } from "@/components/app/landing/SiteFooter";
import { OCCASION_GUIDES } from "@/components/app/guides/occasions";
import "@/components/app/guides/guides.css";

export const metadata: Metadata = {
  title: "Occasion ideas — Wishly",
  description: "Thoughtful ideas, message starters and simple planning guides for a personal celebration page.",
};

export default async function OccasionsPage() {
  const user = await getCurrentUser();
  return (
    <>
      <LandingNav loggedIn={!!user} />
      <main className="guide-page">
        <header className="guide-index-hero container-page">
          <p className="eyebrow">A LITTLE INSPIRATION</p>
          <h1>Every kind of moment.<br /><em>Your kind of words.</em></h1>
          <p>You already know the person. We will help you find a starting point: a story to tell, a memory to include, a few words that feel like you.</p>
        </header>

        <section className="container-page guide-occasion-list" aria-label="Occasion guides">
          {OCCASION_GUIDES.map((occasion) => (
            <Link key={occasion.slug} href={`/occasions/${occasion.slug}`} className="guide-occasion-link">
              <span className="guide-occasion-number">{occasion.number}</span>
              <div className="guide-occasion-art" style={{ background: occasion.colour }} aria-hidden><span>{occasion.motif}</span></div>
              <div className="guide-occasion-description"><h2>{occasion.name}</h2><p>{occasion.short}</p><span>Ideas, writing prompts & a sharing checklist</span></div>
              <ArrowUpRight className="guide-occasion-arrow" size={24} strokeWidth={1.4} aria-hidden />
            </Link>
          ))}
        </section>

        <section className="container-page guide-start-small">
          <div><p className="eyebrow">IF YOU ARE STARING AT A BLANK PAGE</p><h2>Three things are enough<br />to begin.</h2></div>
          <ol>
            <li><span>01</span><div><h3>One person</h3><p>Write for them, not an audience. Imagine them reading it on their phone.</p></div></li>
            <li><span>02</span><div><h3>One real memory</h3><p>Choose a moment you both recognise. Small details do the heavy lifting.</p></div></li>
            <li><span>03</span><div><h3>One honest sentence</h3><p>Say why they matter. It does not need to be clever to be worth keeping.</p></div></li>
          </ol>
        </section>

        <section className="guide-bottom-invite container-page">
          <h2>A good place to start<br />is right here.</h2>
          <div><p>Find a design, bring your own words, and build a page around the person you have in mind.</p><Link className="guide-primary-link" href="/templates">Explore the collection <ArrowRight size={16} aria-hidden /></Link></div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
