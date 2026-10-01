"use client";

// EP-26 stat cards for the admin Stats tab.
import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, Skeleton } from "@/components/ui/card";
import { api } from "@/lib/client-api";

type PlatformStats = {
  users: number;
  pages: number;
  livePages: number;
  disabledPages: number;
  wishes: number;
  totalViews: number;
};

const CARDS: { key: keyof PlatformStats; label: string; hint: string }[] = [
  { key: "users", label: "Users", hint: "Registered accounts" },
  { key: "pages", label: "Pages", hint: "All wish pages" },
  { key: "livePages", label: "Live pages", hint: "Published or scheduled" },
  { key: "disabledPages", label: "Disabled pages", hint: "Blocked by an admin" },
  { key: "wishes", label: "Wishes", hint: "Wall messages" },
  { key: "totalViews", label: "Total views", hint: "Across every page" },
];

export function StatsCards() {
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Loads EP-26 once and again on every retry.
  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setStats(await api<PlatformStats>("/admin/stats"));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {CARDS.map((card) => (
          <Card key={card.key}>
            <CardContent className="flex flex-col gap-3 p-5">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-8 w-20" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error || !stats) {
    return (
      <Card>
        <CardContent className="flex flex-col items-start gap-3 p-5">
          <p className="text-sm text-ink">{error ?? "Stats are unavailable right now."}</p>
          <Button variant="outline" onClick={() => void load()}>
            Try again
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {CARDS.map((card) => (
        <Card key={card.key}>
          <CardContent className="flex flex-col gap-3 p-6">
            <span className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">{card.label}</span>
            <span className="font-heading text-5xl font-normal tracking-tight text-primary">
              {stats[card.key].toLocaleString()}
            </span>
            <span className="text-xs text-muted">{card.hint}</span>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
