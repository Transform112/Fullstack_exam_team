"use client";

// Admin console: five tabs, each tab owns its data fetching and actions.
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PagesTable } from "@/components/app/admin/PagesTable";
import { StatsCards } from "@/components/app/admin/StatsCards";
import { TemplatesPanel } from "@/components/app/admin/TemplatesPanel";
import { UsersTable } from "@/components/app/admin/UsersTable";
import { WishesTable } from "@/components/app/admin/WishesTable";

const TABS = [
  { value: "stats", label: "Stats" },
  { value: "pages", label: "Pages" },
  { value: "users", label: "Users" },
  { value: "wishes", label: "Wishes" },
  { value: "templates", label: "Templates" },
] as const;

export default function AdminPage() {
  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-3 border-b border-border pb-8">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">Workspace management</p>
        <h1 className="font-heading text-4xl font-normal tracking-tight text-ink sm:text-5xl">Admin console</h1>
        <p className="max-w-lg text-sm leading-relaxed text-muted">A clear view of your community. Review activity, manage templates and keep celebrations welcoming.</p>
      </header>

      <Tabs defaultValue="stats" className="w-full">
        <TabsList aria-label="Admin sections" className="mb-6 flex h-auto flex-wrap justify-start gap-1 rounded-xl border border-border bg-white p-1.5">
          {TABS.map((tab) => (
            <TabsTrigger key={tab.value} value={tab.value} className="min-h-11">
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="stats">
          <StatsCards />
        </TabsContent>
        <TabsContent value="pages">
          <PagesTable />
        </TabsContent>
        <TabsContent value="users">
          <UsersTable />
        </TabsContent>
        <TabsContent value="wishes">
          <WishesTable />
        </TabsContent>
        <TabsContent value="templates">
          <TemplatesPanel />
        </TabsContent>
      </Tabs>
    </div>
  );
}
