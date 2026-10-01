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
      <header className="flex flex-col gap-1">
        <h1 className="font-heading text-2xl font-semibold text-ink sm:text-3xl">Admin console</h1>
        <p className="text-sm text-muted">Moderate pages, users, wishes and templates.</p>
      </header>

      <Tabs defaultValue="stats" className="w-full">
        <TabsList aria-label="Admin sections">
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
