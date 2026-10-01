// Landing section 9 (docs/04 SECTION 8.9): static footer, so it stays a server component.
import Link from "next/link";
import { Heart } from "lucide-react";

const LINKS = [
  { href: "/templates", label: "Templates" },
  { href: "/login", label: "Login" },
  { href: "/signup", label: "Sign up" },
];

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-white">
      <div className="container-page flex flex-col items-center gap-6 py-10 sm:flex-row sm:justify-between">
        <Link href="/" className="flex items-center gap-2" aria-label="Wishly home">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-primary to-accent">
            <Heart className="h-4 w-4 text-white" fill="currentColor" aria-hidden />
          </span>
          <span className="font-heading text-lg font-bold text-ink">Wishly</span>
        </Link>

        <nav aria-label="Footer">
          <ul className="flex items-center gap-1">
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
        </nav>

        <p className="text-sm text-muted">Made with love on Wishly</p>
      </div>
    </footer>
  );
}

export default SiteFooter;
