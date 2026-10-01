"use client";

// Public navbar for the marketing pages (docs/04 SECTION 8.1). It collapses into a
// simple sheet under 768px and swaps Login for Dashboard when a session exists.
import { useEffect, useState } from "react";
import Link from "next/link";
import { Heart, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";

const LINKS = [
  { href: "/#how-it-works", label: "How it works" },
  { href: "/#templates", label: "Templates" },
  { href: "/#faq", label: "FAQ" },
];

export function LandingNav({ loggedIn = false }: { loggedIn?: boolean }) {
  const [open, setOpen] = useState(false);

  // A sheet left open while the viewport grows would linger behind the desktop bar.
  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth >= 768) setOpen(false);
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  return (
    <header className="sticky top-0 z-40 border-b border-border/70 bg-canvas/85 backdrop-blur-md">
      <nav
        className="container-page flex h-16 items-center justify-between gap-4"
        aria-label="Main"
      >
        <Link href="/" className="flex items-center gap-2" aria-label="Wishly home">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-primary to-accent">
            <Heart className="h-4 w-4 text-white" fill="currentColor" aria-hidden />
          </span>
          <span className="font-heading text-lg font-bold text-ink">Wishly</span>
        </Link>

        <ul className="hidden items-center gap-1 md:flex">
          {LINKS.map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                className="flex h-11 items-center rounded-full px-3 text-sm font-medium text-muted hover:text-ink"
              >
                {link.label}
              </Link>
            </li>
          ))}
        </ul>

        <div className="hidden items-center gap-2 md:flex">
          <Link
            href={loggedIn ? "/dashboard" : "/login"}
            className="flex h-11 items-center rounded-full px-4 text-sm font-medium text-ink hover:bg-white/70"
          >
            {loggedIn ? "Dashboard" : "Login"}
          </Link>
          <Button asChild size="lg" className="h-11">
            <Link href="/signup">Create a surprise</Link>
          </Button>
        </div>

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-controls="landing-menu"
          aria-label={open ? "Close menu" : "Open menu"}
          className="flex h-11 w-11 items-center justify-center rounded-full text-ink hover:bg-white/70 md:hidden"
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </nav>

      {open ? (
        <div
          id="landing-menu"
          className="border-t border-border bg-canvas px-5 pb-6 pt-2 md:hidden"
        >
          <ul className="flex flex-col">
            {LINKS.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className="flex min-h-11 items-center py-3 text-base font-medium text-ink"
                >
                  {link.label}
                </Link>
              </li>
            ))}
            <li>
              <Link
                href={loggedIn ? "/dashboard" : "/login"}
                onClick={() => setOpen(false)}
                className="flex min-h-11 items-center py-3 text-base font-medium text-ink"
              >
                {loggedIn ? "Dashboard" : "Login"}
              </Link>
            </li>
          </ul>
          <Button asChild size="lg" className="mt-2 w-full">
            <Link href="/signup" onClick={() => setOpen(false)}>
              Create a surprise
            </Link>
          </Button>
        </div>
      ) : null}
    </header>
  );
}

export default LandingNav;
