"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LayoutDashboard, LogOut, Menu, Shield, Sparkles, X } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/client-api";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type AppNavUser = { name: string; role: "USER" | "ADMIN" };

// Links every signed-in member sees, plus Admin for role ADMIN (docs/03 step P1-02).
const USER_LINKS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/templates", label: "Templates", icon: Sparkles },
];

// Top navigation for the signed-in app shell. It stays usable at 360px: on small
// screens the links collapse into a toggleable panel and every control is 44px tall.
export function AppNav({ user }: { user: AppNavUser }) {
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const links =
    user.role === "ADMIN"
      ? [...USER_LINKS, { href: "/admin", label: "Admin", icon: Shield }]
      : USER_LINKS;

  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  // Calls EP-04 to clear the cookie, then returns the visitor to the login page.
  async function logout() {
    setLoggingOut(true);
    try {
      await api("/auth/logout", { method: "POST" });
      toast.success("Logged out");
      router.push("/login");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not log out");
      setLoggingOut(false);
    }
  }

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-canvas">
      <div className="container-page flex min-h-20 items-center justify-between gap-3">
        <Link
          href="/dashboard"
          onClick={() => setOpen(false)}
          className="flex h-11 items-center gap-2 font-heading text-3xl tracking-tight text-primary"
        >
          <Sparkles className="h-5 w-5" aria-hidden />
          wishly<span className="text-accent">.</span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex" aria-label="Main">
          {links.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              aria-current={isActive(href) ? "page" : undefined}
              className={cn(
                "flex h-11 items-center gap-2 rounded-lg px-4 text-sm font-medium text-muted hover:bg-white hover:text-primary",
                isActive(href) && "bg-primary/10 text-primary",
              )}
            >
              <Icon className="h-4 w-4" aria-hidden />
              {label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <span className="hidden max-w-[10rem] truncate border-r border-border pr-4 text-sm text-muted sm:block">
            {user.name}
          </span>
          <Button
            type="button"
            variant="outline"
            className="hidden md:inline-flex"
            onClick={logout}
            disabled={loggingOut}
          >
            <LogOut className="h-4 w-4" aria-hidden />
            {loggingOut ? "Logging out" : "Logout"}
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="md:hidden"
            aria-expanded={open}
            aria-controls="app-nav-menu"
            aria-label={open ? "Close menu" : "Open menu"}
            onClick={() => setOpen((value) => !value)}
          >
            {open ? (
              <X className="h-5 w-5" aria-hidden />
            ) : (
              <Menu className="h-5 w-5" aria-hidden />
            )}
          </Button>
        </div>
      </div>

      {open ? (
        <div id="app-nav-menu" className="border-t border-border bg-white md:hidden">
          <nav className="container-page flex flex-col py-2" aria-label="Mobile">
            {links.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                onClick={() => setOpen(false)}
                aria-current={isActive(href) ? "page" : undefined}
                className={cn(
                  "flex h-11 items-center gap-3 rounded-xl px-3 text-sm font-medium text-ink",
                  isActive(href) && "bg-canvas text-primary",
                )}
              >
                <Icon className="h-4 w-4" aria-hidden />
                {label}
              </Link>
            ))}
            <span className="px-3 py-2 text-xs text-muted">{user.name}</span>
            <Button
              type="button"
              variant="outline"
              className="mt-1"
              onClick={logout}
              disabled={loggingOut}
            >
              <LogOut className="h-4 w-4" aria-hidden />
              {loggingOut ? "Logging out" : "Logout"}
            </Button>
          </nav>
        </div>
      ) : null}
    </header>
  );
}
