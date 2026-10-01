"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import { api } from "@/lib/client-api";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/card";
import { EmptyState } from "@/components/app/EmptyState";
import { ErrorState } from "@/components/app/ErrorState";
import { PageCard, type DashboardCard } from "@/components/app/PageCard";

const PAGE_SIZE = 12;

type MinePage = {
  items: DashboardCard[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

const errorMessage = (err: unknown) =>
  err instanceof Error ? err.message : "Something went wrong";

// Creator dashboard: EP-08 card grid with skeletons, empty, error and paging states.
export default function DashboardPage() {
  const [items, setItems] = useState<DashboardCard[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (next: number) => {
    setLoading(true);
    setError(null);
    try {
      const data = await api<MinePage>(`/pages/mine?page=${next}&limit=${PAGE_SIZE}`);
      setItems(data.items);
      setPage(data.page);
      setTotal(data.total);
      setTotalPages(data.totalPages);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load(page);
  }, [load, page]);

  // Card actions call this so the list reflects the new status after every mutation.
  const refresh = useCallback(() => {
    void load(page);
  }, [load, page]);

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-5 border-b border-border pb-8 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-accent">Your celebration studio</p>
          <h1 className="font-heading text-4xl font-normal tracking-tight text-ink sm:text-5xl">
            Your surprises
          </h1>
          <p className="mt-3 max-w-lg text-sm leading-relaxed text-muted">
            A little collection of big feelings. Create, finish and share something personal.
          </p>
          <p className="mt-3 text-xs text-muted" role="status" aria-live="polite" aria-atomic="true">
            {loading ? "Loading your collection…" : `${total} ${total === 1 ? "page" : "pages"}`} · up to 50 per account
          </p>
        </div>
        <Button asChild className="w-full sm:w-auto">
          <Link href="/create">
            <Plus className="h-4 w-4" aria-hidden />
            Create a surprise
          </Link>
        </Button>
      </header>

      {loading ? (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3" aria-hidden>
          {Array.from({ length: 6 }).map((_, index) => (
            <Skeleton key={index} className="h-80 w-full" />
          ))}
        </div>
      ) : error ? (
        <ErrorState message={error} onRetry={refresh} />
      ) : items.length === 0 ? (
        <EmptyState
          title="No surprises yet"
          description="Turn a few photos and a few words into an animated page you can share with one link."
          actionLabel="Create your first surprise"
          actionHref="/create"
        />
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
            <PageCard key={item.id} page={item} onChanged={refresh} />
          ))}
        </div>
      )}

      {!error && totalPages > 1 ? (
        <nav className="flex flex-wrap items-center justify-center gap-3" aria-label="Pagination">
          <Button
            type="button"
            variant="outline"
            onClick={() => setPage((value) => Math.max(1, value - 1))}
            disabled={loading || page <= 1}
          >
            Previous
          </Button>
          <span className="text-sm text-muted">
            Page {page} of {totalPages}
          </span>
          <Button
            type="button"
            variant="outline"
            onClick={() => setPage((value) => Math.min(totalPages, value + 1))}
            disabled={loading || page >= totalPages}
          >
            Next
          </Button>
        </nav>
      ) : null}
    </div>
  );
}
