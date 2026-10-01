import Link from "next/link";
import { ArrowRight, ArrowUp, Heart } from "lucide-react";
import { Brand } from "@/components/app/Brand";

const GROUPS = [
  {
    title: "The studio",
    links: [
      { href: "/templates", label: "Explore the collection" },
      { href: "/#how-it-works", label: "How it works" },
      { href: "/signup", label: "Create a surprise" },
      { href: "/login", label: "Back to my account" },
    ],
  },
  {
    title: "Every occasion",
    links: [
      { href: "/occasions/birthday", label: "Birthdays" },
      { href: "/occasions/anniversary", label: "Anniversaries" },
      { href: "/occasions/friendship", label: "Friendship" },
      { href: "/occasions/farewell", label: "Farewells" },
      { href: "/occasions/custom", label: "Just because" },
    ],
  },
  {
    title: "A little guidance",
    links: [
      { href: "/help", label: "Help & common questions" },
      { href: "/occasions", label: "Ideas & message starters" },
      { href: "/#faq", label: "Before you begin" },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="studio-footer">
      <div className="container-page">
        <div className="studio-footer-invitation">
          <div>
            <p className="eyebrow">SOMETHING SMALL. SOMETHING MEANINGFUL.</p>
            <h2>A little link.<br /><em>A lovely lasting feeling.</em></h2>
          </div>
          <div className="studio-footer-invitation-note">
            <span className="footer-stamp" aria-hidden><Heart size={24} strokeWidth={1.3} /></span>
            <p>For the birthdays, the big days,<br />and the beautifully ordinary ones.</p>
            <Link href="/signup">Make it personal <ArrowRight size={17} aria-hidden /></Link>
          </div>
        </div>
        <div className="studio-footer-main">
          <div className="studio-footer-brand">
            <Brand light caption />
            <p>A celebration studio for your favourite people. Turn your memories and words into a page that feels like a hug.</p>
            <span className="studio-footer-signature">Thoughtfully made.<br />Joyfully shared.</span>
          </div>
          {GROUPS.map((group) => (
            <nav aria-label={group.title} key={group.title}>
              <h3>{group.title}</h3>
              <ul>
                {group.links.map((link) => (
                  <li key={link.href}><Link href={link.href}>{link.label}</Link></li>
                ))}
              </ul>
            </nav>
          ))}
        </div>
        <div className="studio-footer-bottom">
          <p>Wishly · Little pages. Big feelings.</p>
          <p>Made for moments worth keeping.</p>
          <a href="#site-top" className="studio-back-top">Back to the top <ArrowUp size={15} aria-hidden /></a>
        </div>
      </div>
    </footer>
  );
}

export default SiteFooter;
