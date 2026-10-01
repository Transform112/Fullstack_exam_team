import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BookOpen, Layers, PenLine } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { LandingNav } from "@/components/app/LandingNav";
import { SiteFooter } from "@/components/app/landing/SiteFooter";
import { HelpExplorer } from "@/components/app/guides/HelpExplorer";
import "@/components/app/guides/guides.css";

export const metadata: Metadata = { title: "A little help — Wishly", description: "Answers about creating, writing, sharing and managing your Wishly celebration pages." };

export default async function HelpPage() {
  const user = await getCurrentUser();
  return (
    <>
      <LandingNav loggedIn={!!user} />
      <main className="guide-page container-page">
        <header className="help-hero"><p className="eyebrow">A LITTLE HELP ALONG THE WAY</p><h1>Less wondering.<br /><em>More making.</em></h1><p>From your first idea to the moment you share it. Find a clear answer and get back to making something personal.</p></header>
        <HelpExplorer />
        <section className="help-next-steps" aria-label="Useful next steps">
          <Link href="/occasions"><BookOpen size={23} strokeWidth={1.5} aria-hidden /><h2>Find a beginning</h2><p>Prompts, message starters and thoughtful occasion guides.</p><span>Explore ideas <ArrowRight size={15} aria-hidden /></span></Link>
          <Link href="/templates"><Layers size={23} strokeWidth={1.5} aria-hidden /><h2>See the collection</h2><p>Compare three distinct moods and explore a real sample preview.</p><span>Browse designs <ArrowRight size={15} aria-hidden /></span></Link>
          <Link href={user ? "/create" : "/signup"}><PenLine size={23} strokeWidth={1.5} aria-hidden /><h2>Make it personal</h2><p>Bring your memories and words into the step-by-step creator.</p><span>{user ? "Open the creator" : "Get started"} <ArrowRight size={15} aria-hidden /></span></Link>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
