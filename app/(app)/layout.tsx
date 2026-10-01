import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { AppNav } from "@/components/app/AppNav";

// Protected app shell (docs/03 step P1-02): every page below requires a session and
// gets the app navigation plus the shared page container.
export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  return (
    <div className="flex min-h-dvh flex-col bg-canvas">
      <AppNav user={{ name: user.name, role: user.role }} />
      <main className="container-page flex-1 py-8 sm:py-12">{children}</main>
      <footer className="container-page border-t border-border py-6 text-xs text-muted">
        Made for the people who mean everything. <span className="text-primary">Wishly studio</span>
      </footer>
    </div>
  );
}
