import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, Check } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { LandingNav } from "@/components/app/LandingNav";
import { SiteFooter } from "@/components/app/landing/SiteFooter";
import { findOccasion, OCCASION_GUIDES } from "@/components/app/guides/occasions";
import { MessageStarters } from "@/components/app/guides/MessageStarters";
import "@/components/app/guides/guides.css";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const guide = findOccasion(slug);
  return guide ? { title: `${guide.name}: ideas & messages — Wishly`, description: guide.introduction } : { title: "Guide not found — Wishly" };
}

export default async function OccasionGuidePage({ params }: Props) {
  const { slug } = await params;
  const guide = findOccasion(slug);
  if (!guide) notFound();
  const user = await getCurrentUser();
  const related = OCCASION_GUIDES.filter((item) => item.slug !== slug).slice(0, 2);

  return (
    <>
      <LandingNav loggedIn={!!user} />
      <main className="guide-page">
        <header className="container-page guide-detail-hero">
          <Link className="guide-back" href="/occasions"><ArrowLeft size={16} aria-hidden />All occasion ideas</Link>
          <div className="guide-detail-heading">
            <div><p className="eyebrow">THE {guide.name.toUpperCase()} GUIDE</p><h1>{guide.title}</h1><p>{guide.introduction}</p></div>
            <div className="guide-detail-card" style={{ background: guide.colour }}><span className="guide-detail-card-number">No. {guide.number}</span><p>{guide.motif}</p><span>Made personal. Made with Wishly.</span></div>
          </div>
          <nav className="guide-jump-links" aria-label="On this guide"><a href="#approach">Make a plan</a><a href="#words">Find the words</a><a href="#checklist">Before you share</a></nav>
        </header>

        <div className="container-page guide-body-layout">
          <div className="guide-main-content">
            <section id="approach" className="guide-section">
              <p className="eyebrow">01 / MAKE IT PERSONAL</p><h2>A thoughtful way in.</h2><p className="guide-lead">{guide.opening}</p>
              <div className="guide-approach-list">{guide.approach.map((step, index) => <article key={step.title}><span>0{index + 1}</span><div><h3>{step.title}</h3><p>{step.body}</p></div></article>)}</div>
            </section>

            <section id="words" className="guide-section">
              <p className="eyebrow">02 / FIND THE WORDS</p><h2>A few questions to unlock a story.</h2>
              <p>You do not need to answer all of these. Pick the question that immediately makes you think of them.</p>
              <ul className="guide-prompts">{guide.prompts.map((prompt) => <li key={prompt}>{prompt}</li>)}</ul>
              <h3 className="guide-starters-heading">Borrow a beginning. Make the rest yours.</h3>
              <p>These are original writing starters, not finished messages. Copy one if it helps, then add a detail only you could write.</p>
              <MessageStarters starters={guide.starters} />
            </section>

            <section id="checklist" className="guide-section">
              <p className="eyebrow">03 / THE LAST LITTLE CHECK</p><h2>Before you send the link.</h2>
              <ul className="guide-checklist">{guide.checklist.map((item) => <li key={item}><Check size={18} aria-hidden /><span>{item}</span></li>)}</ul>
              <aside className="guide-kind-note"><h3>A thoughtful boundary</h3><p>{guide.avoid}</p></aside>
            </section>
          </div>

          <aside className="guide-sidebar">
            <div className="guide-sidebar-card"><p className="eyebrow">MATCH THE MOOD</p><h2>{guide.template}</h2><p>{guide.templateReason}</p><Link href="/templates">Preview the designs <ArrowRight size={16} aria-hidden /></Link></div>
            <div className="guide-sidebar-note"><h3>Ready to make it?</h3><p>Start with your account, then choose the occasion and style inside the creator. This guide does not preselect your settings.</p><Link href={user ? "/create" : "/signup"}>{user ? "Open the creator" : "Create an account"}<ArrowRight size={16} aria-hidden /></Link></div>
          </aside>
        </div>

        <section className="container-page guide-related"><div><p className="eyebrow">MORE LITTLE BEGINNINGS</p><h2>Another moment in mind?</h2></div><div>{related.map((item) => <Link key={item.slug} href={`/occasions/${item.slug}`}><span>{item.name}</span><ArrowRight size={18} aria-hidden /></Link>)}</div></section>
      </main>
      <SiteFooter />
    </>
  );
}
