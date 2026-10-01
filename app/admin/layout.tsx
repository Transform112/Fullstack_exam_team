// Admin shell. The role check runs on the server so /admin is never reachable
// by a signed-in creator even if the navigation link is hidden.
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { AppNav } from "@/components/app/AppNav";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "ADMIN") redirect("/dashboard");

  return (
    <div className="min-h-dvh bg-canvas font-body text-ink">
      <AppNav user={{ name: user.name, role: user.role }} />
      <main className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:py-8">{children}</main>
    </div>
  );
}
