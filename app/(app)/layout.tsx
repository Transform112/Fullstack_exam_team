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
      <main className="container-page py-8">{children}</main>
    </div>
  );
}
