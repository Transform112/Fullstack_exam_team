"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ArrowRight,
  ArrowUpRight,
  Cake,
  ChevronDown,
  Flower2,
  Heart,
  Menu,
  PartyPopper,
  Sparkles,
  X,
} from "lucide-react";
import { Brand } from "@/components/app/Brand";
import { Button } from "@/components/ui/button";

const OCCASIONS = [
  { href: "/occasions/birthday", label: "Birthdays", note: "Their day, made a little brighter", icon: Cake },
  { href: "/occasions/anniversary", label: "Anniversaries", note: "Another chapter of your story", icon: Heart },
  { href: "/occasions/friendship", label: "Friendship", note: "For your favourite kind of human", icon: Flower2 },
  { href: "/occasions/farewell", label: "Farewells", note: "A keepsake for their next chapter", icon: PartyPopper },
  { href: "/occasions/custom", label: "Just because", note: "The little moments count, too", icon: Sparkles },
];

export function LandingNav({ loggedIn = false }: { loggedIn?: boolean }) {
  const pathname = usePathname();
  const [occasionOpen, setOccasionOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const disclosureRef = useRef<HTMLDivElement>(null);
  const occasionButtonRef = useRef<HTMLButtonElement>(null);
  const mobileDialogRef = useRef<HTMLDialogElement>(null);
  const createHref = loggedIn ? "/create" : "/signup";

  const active = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  // Route changes close disclosures, including browser history navigation.
  useEffect(() => {
    setOccasionOpen(false);
    setMobileOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!occasionOpen) return;
    const closeOutside = (event: PointerEvent) => {
      if (event.target instanceof Node && !disclosureRef.current?.contains(event.target)) {
        setOccasionOpen(false);
      }
    };
    document.addEventListener("pointerdown", closeOutside);
    return () => document.removeEventListener("pointerdown", closeOutside);
  }, [occasionOpen]);

  // A native modal gives the small-screen navigation a real focus boundary.
  useEffect(() => {
    const dialog = mobileDialogRef.current;
    if (!dialog) return;
    if (mobileOpen && !dialog.open) dialog.showModal();
    if (!mobileOpen && dialog.open) dialog.close();
  }, [mobileOpen]);

  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth >= 960) setMobileOpen(false);
      else setOccasionOpen(false);
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  function closeNavigation() {
    setMobileOpen(false);
    setOccasionOpen(false);
  }

  return (
    <header id="site-top" className="studio-header" tabIndex={-1}>
      <div className="studio-header-note">
        <span>A little thought goes a long way.</span>
        <Link href="/occasions">Find your reason to celebrate <ArrowUpRight size={12} aria-hidden /></Link>
      </div>
      <nav className="container-page studio-navigation" aria-label="Main navigation">
        <Brand caption />
        <div className="studio-navigation-links">
          <Link href="/templates" className="studio-nav-link" aria-current={active("/templates") ? "page" : undefined}>
            The collection
          </Link>
          <div
            className="occasion-disclosure"
            ref={disclosureRef}
            onBlur={(event) => {
              if (event.relatedTarget instanceof Node && !event.currentTarget.contains(event.relatedTarget)) {
                setOccasionOpen(false);
              }
            }}
            onKeyDown={(event) => {
              if (event.key === "Escape" && occasionOpen) {
                event.preventDefault();
                setOccasionOpen(false);
                occasionButtonRef.current?.focus();
              }
            }}
          >
            <button
              ref={occasionButtonRef}
              type="button"
              className="studio-nav-link"
              aria-expanded={occasionOpen}
              aria-controls="occasion-navigation"
              data-active={active("/occasions") || undefined}
              onClick={() => setOccasionOpen((value) => !value)}
            >
              Occasions
              <ChevronDown size={13} aria-hidden className={occasionOpen ? "disclosure-chevron is-open" : "disclosure-chevron"} />
            </button>
            {occasionOpen && (
              <div id="occasion-navigation" className="occasion-navigation">
                <div className="occasion-navigation-intro">
                  <p className="eyebrow">EVERY REASON, EVERY FEELING</p>
                  <h2>Who’s on<br />your mind?</h2>
                  <p>Start with a moment. We’ll help you find the words.</p>
                  <Link href="/occasions" onClick={closeNavigation}>All occasion guides <ArrowRight size={15} aria-hidden /></Link>
                </div>
                <ul className="occasion-navigation-list">
                  {OCCASIONS.map(({ href, label, note, icon: Icon }) => (
                    <li key={href}>
                      <Link href={href} onClick={closeNavigation} aria-current={pathname === href ? "page" : undefined}>
                        <Icon size={19} strokeWidth={1.5} aria-hidden />
                        <span><strong>{label}</strong><small>{note}</small></span>
                        <ArrowUpRight size={14} aria-hidden />
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
          <Link href="/#how-it-works" className="studio-nav-link">How it works</Link>
          <Link href="/help" className="studio-nav-link" aria-current={active("/help") ? "page" : undefined}>A little help</Link>
        </div>
        <div className="studio-navigation-account">
          <Link href={loggedIn ? "/dashboard" : "/login"} className="studio-login-link">
            {loggedIn ? "My studio" : "Log in"}
          </Link>
          <Button asChild>
            <Link href={createHref}>Create a surprise <ArrowUpRight size={15} aria-hidden /></Link>
          </Button>
        </div>
        <button
          type="button"
          onClick={() => setMobileOpen(true)}
          className="studio-mobile-toggle"
          aria-label="Open menu"
          aria-expanded={mobileOpen}
          aria-controls="studio-mobile-navigation"
        >
          <span>Menu</span><Menu size={20} aria-hidden />
        </button>
      </nav>

      <dialog
        id="studio-mobile-navigation"
        ref={mobileDialogRef}
        className="studio-mobile-dialog"
        aria-labelledby="mobile-navigation-title"
        onCancel={() => setMobileOpen(false)}
        onClose={() => setMobileOpen(false)}
        onKeyDown={(event) => {
          if (event.key !== "Tab") return;
          const controls = Array.from(
            event.currentTarget.querySelectorAll<HTMLElement>("a[href], button:not([disabled])"),
          ).filter((element) => element.getClientRects().length > 0);
          const firstControl = controls[0];
          const lastControl = controls[controls.length - 1];
          if (event.shiftKey && document.activeElement === firstControl) {
            event.preventDefault();
            lastControl?.focus();
          } else if (!event.shiftKey && document.activeElement === lastControl) {
            event.preventDefault();
            firstControl?.focus();
          }
        }}
      >
        <div className="studio-mobile-dialog-header">
          <Brand onClick={closeNavigation} />
          <button type="button" autoFocus onClick={closeNavigation} aria-label="Close menu" className="studio-mobile-close">
            <X size={22} aria-hidden />
          </button>
        </div>
        <nav aria-label="Mobile navigation" className="studio-mobile-content">
          <p id="mobile-navigation-title" className="eyebrow">COME ON IN. MAKE SOMETHING LOVELY.</p>
          <ul className="studio-mobile-primary">
            {[
              ["/templates", "The collection", "01"],
              ["/occasions", "Find an occasion", "02"],
              ["/#how-it-works", "How it works", "03"],
              ["/help", "A little help", "04"],
            ].map(([href, label, number]) => (
              <li key={href}>
                <Link href={href} onClick={closeNavigation} aria-current={active(href) ? "page" : undefined}>
                  <small>{number}</small><span>{label}</span><ArrowUpRight size={19} aria-hidden />
                </Link>
              </li>
            ))}
          </ul>
          <div className="studio-mobile-occasions">
            <p className="eyebrow">A MOMENT WORTH MARKING</p>
            <div>
              {OCCASIONS.map(({ href, label }) => <Link key={href} href={href} onClick={closeNavigation}>{label}</Link>)}
            </div>
          </div>
          <div className="studio-mobile-account">
            <Button asChild size="lg"><Link href={createHref} onClick={closeNavigation}>Create a surprise <ArrowRight size={17} aria-hidden /></Link></Button>
            <Link className="text-link" href={loggedIn ? "/dashboard" : "/login"} onClick={closeNavigation}>{loggedIn ? "Return to my studio" : "Already have an account? Log in"}</Link>
          </div>
        </nav>
        <p className="studio-mobile-signoff">Little pages. Big feelings.</p>
      </dialog>
    </header>
  );
}

export default LandingNav;
