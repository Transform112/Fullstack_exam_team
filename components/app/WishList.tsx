"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/client-api";
import { formatDate } from "@/lib/utils";
import { Badge, Separator, Skeleton } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/app/ConfirmDialog";
import { EmptyState } from "@/components/app/EmptyState";
import { ErrorState } from "@/components/app/ErrorState";

export type WishListItem = {
  id: string;
  name: string;
  message: string;
  emoji: string;
  isHidden: boolean;
  createdAt: string | Date;
};

export type WishListProps = {
  pageId: string;
  initialWishes: WishListItem[];
  initialTotal: number;
  limit?: number;
  onDeleted?: () => void;
};

type WishListPage = {
  items: WishListItem[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

const DEFAULT_LIMIT = 10;

const errorMessage = (err: unknown) =>
  err instanceof Error ? err.message : "Something went wrong";

// Owner wish moderation list from EP-23 with a per-wish delete (EP-24).
export function WishList({
  pageId,
  initialWishes,
  initialTotal,
  limit = DEFAULT_LIMIT,
  onDeleted,
}: WishListProps) {
  const router = useRouter();
  const [items, setItems] = useState<WishListItem[]>(initialWishes);
  const [total, setTotal] = useState(initialTotal);
  const [loadedPage, setLoadedPage] = useState(1);
  const [loading, setLoading] = useState(initialWishes.length === 0);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState<WishListItem | null>(null);

  // Reloads the newest page with visible skeletons; used by the error state Retry button.
  const loadFirstPage = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api<WishListPage>(`/pages/${pageId}/wishes?page=1&limit=${limit}`);
      setItems(data.items);
      setTotal(data.total);
      setLoadedPage(data.page);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [pageId, limit]);

  // The list is fetched on mount from EP-23: with no server-side page it drives the
  // skeleton and error states, otherwise it quietly revalidates the initial data.
  useEffect(() => {
    let cancelled = false;
    const hasInitialData = initialWishes.length > 0;
    if (!hasInitialData) setLoading(true);

    void (async () => {
      try {
        const data = await api<WishListPage>(`/pages/${pageId}/wishes?page=1&limit=${limit}`);
        if (cancelled) return;
        setItems(data.items);
        setTotal(data.total);
        setLoadedPage(data.page);
        setError(null);
      } catch (err) {
        if (cancelled || hasInitialData) return;
        setError(errorMessage(err));
      } finally {
        if (!cancelled && !hasInitialData) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [initialWishes.length, pageId, limit]);

  async function showMore() {
    setLoadingMore(true);
    try {
      const data = await api<WishListPage>(
        `/pages/${pageId}/wishes?page=${loadedPage + 1}&limit=${limit}`,
      );
      setItems((prev) => [...prev, ...data.items]);
      setTotal(data.total);
      setLoadedPage(data.page);
      setError(null);
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setLoadingMore(false);
    }
  }

  // EP-24: removes the wish and keeps the list and the view counts in step.
  async function deleteWish(wish: WishListItem) {
    try {
      await api(`/pages/${pageId}/wishes/${wish.id}`, { method: "DELETE" });
      toast.success("Wish deleted");
      setItems((prev) => prev.filter((item) => item.id !== wish.id));
      setTotal((value) => Math.max(0, value - 1));
      // The stat cards live in the server page, so a client parent is told directly and
      // otherwise the server page is refreshed to decrement the wishes card.
      if (onDeleted) onDeleted();
      else router.refresh();
    } catch (err) {
      toast.error(errorMessage(err));
      throw err;
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <h3 className="font-heading text-base font-semibold text-ink">
          {total} {total === 1 ? "wish" : "wishes"}
        </h3>
        {items.length < total ? (
          <span className="text-xs text-muted">
            Showing {items.length} of {total}
          </span>
        ) : null}
      </div>
      <Separator />

      {loading ? (
        <div className="flex flex-col gap-3" aria-hidden>
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </div>
      ) : error && items.length === 0 ? (
        <ErrorState message={error} onRetry={loadFirstPage} />
      ) : items.length === 0 ? (
        <EmptyState
          title="No wishes yet"
          description="Once friends open your page and leave a wish, it appears here."
        />
      ) : (
        <ul className="flex flex-col gap-3">
          {items.map((wish) => (
            <li
              key={wish.id}
              className="flex items-start gap-3 rounded-card border border-border bg-white p-4"
            >
              <span aria-hidden className="text-2xl leading-none">
                {wish.emoji || "💜"}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="truncate font-medium text-ink">{wish.name || "Anonymous"}</span>
                  <span className="text-xs text-muted">{formatDate(wish.createdAt)}</span>
                  {wish.isHidden ? <Badge tone="unpublished">Hidden</Badge> : null}
                </div>
                <p className="mt-1 whitespace-pre-wrap break-words text-sm text-muted">
                  {wish.message}
                </p>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="shrink-0 text-red-600 hover:bg-red-50"
                aria-label={`Delete wish from ${wish.name || "Anonymous"}`}
                onClick={() => setPending(wish)}
              >
                <Trash2 className="h-4 w-4" aria-hidden />
              </Button>
            </li>
          ))}
        </ul>
      )}

      {items.length < total ? (
        <Button
          type="button"
          variant="outline"
          className="self-center"
          onClick={showMore}
          disabled={loadingMore}
        >
          {loadingMore ? "Loading..." : "Show more"}
        </Button>
      ) : null}

      <ConfirmDialog
        open={Boolean(pending)}
        onOpenChange={(open) => {
          if (!open) setPending(null);
        }}
        title="Delete this wish?"
        description={
          pending ? `The wish from ${pending.name || "Anonymous"} is removed for everyone.` : ""
        }
        confirmLabel="Delete wish"
        destructive
        onConfirm={async () => {
          if (!pending) return;
          await deleteWish(pending);
          setPending(null);
        }}
      />
    </div>
  );
}
