"use client";

// EP-31 list with EP-32 hide/unhide and EP-24 delete for every wish on the platform.
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/app/ConfirmDialog";
import { Button } from "@/components/ui/button";
import { Badge, Card, CardContent, Skeleton } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/client-api";
import { formatDate } from "@/lib/utils";

type WishRow = {
  id: string;
  pageId: string;
  name: string;
  message: string;
  emoji: string;
  isHidden: boolean;
  recipientName: string;
  createdAt: string;
};

type ListResponse<T> = {
  items: T[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

type Pending = { row: WishRow; kind: "hide" } | { row: WishRow; kind: "delete" } | null;

const LIMIT = 20;

export function WishesTable() {
  const [rows, setRows] = useState<WishRow[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [version, setVersion] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState<Pending>(null);
  const [busy, setBusy] = useState(false);

  // Debounce the search box by 400ms and go back to the first page.
  useEffect(() => {
    const timer = setTimeout(() => {
      setQuery(search.trim());
      setPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [search]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ page: String(page), limit: String(LIMIT) });
      if (query) params.set("search", query);
      const data = await api<ListResponse<WishRow>>(`/admin/wishes?${params.toString()}`);
      setRows(data.items);
      setTotal(data.total);
      setTotalPages(data.totalPages);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [page, query]);

  useEffect(() => {
    void load();
  }, [load, version]);

  // Hide/unhide uses EP-32; delete uses the owner-or-admin EP-24 route.
  // Throwing keeps the ConfirmDialog open so the admin can retry.
  async function runPending() {
    if (!pending) return;
    setBusy(true);
    try {
      if (pending.kind === "hide") {
        await api(`/admin/wishes/${pending.row.id}`, {
          method: "PATCH",
          body: { isHidden: !pending.row.isHidden },
        });
        toast.success(pending.row.isHidden ? "Wish unhidden." : "Wish hidden.");
      } else {
        await api(`/pages/${pending.row.pageId}/wishes/${pending.row.id}`, { method: "DELETE" });
        toast.success("Wish deleted.");
      }
      setPending(null);
      setVersion((v) => v + 1);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
      throw err;
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card>
      <CardContent className="flex flex-col gap-4 p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search wish message"
            aria-label="Search wishes"
            className="sm:max-w-xs"
          />
          <p className="text-sm text-muted">
            {total.toLocaleString()} {total === 1 ? "wish" : "wishes"}
          </p>
        </div>

        {error ? (
          <div className="flex flex-col items-start gap-3 rounded-card border border-border bg-canvas p-4">
            <p className="text-sm text-ink">{error}</p>
            <Button variant="outline" onClick={() => setVersion((v) => v + 1)}>
              Try again
            </Button>
          </div>
        ) : (
          <div className="min-w-0 overflow-x-auto">
            <table className="w-full min-w-[760px] border-collapse text-left text-sm">
              <thead>
                <tr className="text-xs uppercase tracking-wide text-muted">
                  <th className="px-3 py-2 font-medium">Wish</th>
                  <th className="px-3 py-2 font-medium">From</th>
                  <th className="px-3 py-2 font-medium">Page</th>
                  <th className="px-3 py-2 font-medium">Status</th>
                  <th className="px-3 py-2 font-medium">Created</th>
                  <th className="px-3 py-2 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading
                  ? Array.from({ length: 5 }).map((_, i) => (
                      <tr key={i} className="border-t border-border">
                        {Array.from({ length: 6 }).map((__, j) => (
                          <td key={j} className="px-3 py-3">
                            <Skeleton className="h-4 w-full" />
                          </td>
                        ))}
                      </tr>
                    ))
                  : rows.map((row) => (
                      <tr key={row.id} className="border-t border-border align-middle">
                        <td className="max-w-[280px] px-3 py-3">
                          <span className="block break-words text-ink">
                            {row.emoji ? `${row.emoji} ` : ""}
                            {row.message}
                          </span>
                        </td>
                        <td className="px-3 py-3 text-ink">{row.name || "Anonymous"}</td>
                        <td className="px-3 py-3 text-muted">{row.recipientName || "Untitled"}</td>
                        <td className="px-3 py-3">
                          <Badge tone={row.isHidden ? "disabled" : "live"}>
                            {row.isHidden ? "Hidden" : "Visible"}
                          </Badge>
                        </td>
                        <td className="px-3 py-3 text-muted">{formatDate(row.createdAt)}</td>
                        <td className="px-3 py-3">
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-11 px-4 text-sm"
                              disabled={busy}
                              onClick={() => setPending({ row, kind: "hide" })}
                            >
                              {row.isHidden ? "Unhide" : "Hide"}
                            </Button>
                            <Button
                              size="sm"
                              variant="danger"
                              className="h-11 px-4 text-sm"
                              disabled={busy}
                              onClick={() => setPending({ row, kind: "delete" })}
                            >
                              Delete
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                {!loading && rows.length === 0 && (
                  <tr className="border-t border-border">
                    <td colSpan={6} className="px-3 py-8 text-center text-sm text-muted">
                      {query ? `No wishes match "${query}".` : "No wishes yet."}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        <div className="flex items-center justify-between gap-3">
          <Button
            variant="outline"
            disabled={page <= 1 || loading}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            Previous
          </Button>
          <span className="text-sm text-muted">
            Page {page} of {totalPages}
          </span>
          <Button
            variant="outline"
            disabled={page >= totalPages || loading}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </Button>
        </div>
      </CardContent>

      <ConfirmDialog
        open={!!pending}
        onOpenChange={(open) => {
          if (!open) setPending(null);
        }}
        title={
          pending?.kind === "delete"
            ? "Delete this wish?"
            : pending?.row.isHidden
              ? "Unhide this wish?"
              : "Hide this wish?"
        }
        description={
          pending?.kind === "delete"
            ? "The wish is removed for good and the page wish count drops by one."
            : pending?.row.isHidden
              ? "The wish becomes visible on the public wishes wall again."
              : "The wish is removed from the public wishes wall but kept for the owner."
        }
        confirmLabel={
          pending?.kind === "delete" ? "Delete wish" : pending?.row.isHidden ? "Unhide" : "Hide"
        }
        destructive={pending?.kind === "delete"}
        onConfirm={runPending}
      />
    </Card>
  );
}
