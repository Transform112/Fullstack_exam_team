"use client";

// EP-27 list + EP-28 disable/enable for every page on the platform.
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/app/ConfirmDialog";
import { Button } from "@/components/ui/button";
import { Badge, Card, CardContent, Skeleton } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/client-api";
import { formatDate } from "@/lib/utils";

type PageStatus = "DRAFT" | "SCHEDULED" | "PUBLISHED" | "UNPUBLISHED" | "DISABLED";

type PageRow = {
  id: string;
  slug: string | null;
  status: PageStatus;
  recipientName: string;
  occasion: string;
  stats: { views: number; uniqueViews: number; wishes: number };
  revealAt: string | null;
  createdAt: string;
  ownerName: string;
  ownerEmail: string;
};

type ListResponse<T> = {
  items: T[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

type PendingAction = { row: PageRow; action: "disable" | "enable" } | null;

const STATUS_TONES: Record<
  PageStatus,
  "live" | "scheduled" | "draft" | "unpublished" | "disabled"
> = {
  PUBLISHED: "live",
  SCHEDULED: "scheduled",
  DRAFT: "draft",
  UNPUBLISHED: "unpublished",
  DISABLED: "disabled",
};

const STATUS_LABELS: Record<PageStatus, string> = {
  PUBLISHED: "Live",
  SCHEDULED: "Scheduled",
  DRAFT: "Draft",
  UNPUBLISHED: "Unpublished",
  DISABLED: "Disabled",
};

const LIMIT = 20;

export function PagesTable() {
  const [rows, setRows] = useState<PageRow[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [version, setVersion] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState<PendingAction>(null);
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
      const data = await api<ListResponse<PageRow>>(`/admin/pages?${params.toString()}`);
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

  // Runs the confirmed disable/enable and refreshes the row from the API.
  // Throwing keeps the ConfirmDialog open so the admin can retry.
  async function runPending() {
    if (!pending) return;
    setBusy(true);
    try {
      await api(`/admin/pages/${pending.row.id}`, {
        method: "PATCH",
        body: { action: pending.action },
      });
      toast.success(pending.action === "disable" ? "Page disabled." : "Page enabled.");
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
            placeholder="Search recipient or slug"
            aria-label="Search pages"
            className="sm:max-w-xs"
          />
          <p className="text-sm text-muted">
            {total.toLocaleString()} {total === 1 ? "page" : "pages"}
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
            <table className="w-full min-w-[720px] border-collapse text-left text-sm">
              <thead>
                <tr className="bg-canvas text-xs uppercase tracking-wide text-muted">
                  <th className="px-3 py-2 font-medium">Recipient</th>
                  <th className="px-3 py-2 font-medium">Owner</th>
                  <th className="px-3 py-2 font-medium">Status</th>
                  <th className="px-3 py-2 font-medium">Views</th>
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
                      <tr key={row.id} className="border-t border-border align-middle transition-colors hover:bg-canvas/60">
                        <td className="px-3 py-3">
                          <span className="block font-medium text-ink">
                            {row.recipientName || "Untitled"}
                          </span>
                          <span className="block text-xs text-muted">
                            {row.slug ?? "No slug yet"}
                          </span>
                        </td>
                        <td className="px-3 py-3">
                          <span className="block text-ink">{row.ownerName}</span>
                          <span className="block text-xs text-muted">{row.ownerEmail}</span>
                        </td>
                        <td className="px-3 py-3">
                          <Badge tone={STATUS_TONES[row.status]}>{STATUS_LABELS[row.status]}</Badge>
                        </td>
                        <td className="px-3 py-3 text-ink">{row.stats.views.toLocaleString()}</td>
                        <td className="px-3 py-3 text-muted">{formatDate(row.createdAt)}</td>
                        <td className="px-3 py-3">
                          {row.status === "DISABLED" ? (
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-11 px-4 text-sm"
                              disabled={busy}
                              onClick={() => setPending({ row, action: "enable" })}
                            >
                              Enable
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              variant="danger"
                              className="h-11 px-4 text-sm"
                              disabled={busy}
                              onClick={() => setPending({ row, action: "disable" })}
                            >
                              Disable
                            </Button>
                          )}
                        </td>
                      </tr>
                    ))}
                {!loading && rows.length === 0 && (
                  <tr className="border-t border-border">
                    <td colSpan={6} className="px-3 py-8 text-center text-sm text-muted">
                      {query ? `No pages match "${query}".` : "No pages yet."}
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
        title={pending?.action === "disable" ? "Disable this page?" : "Enable this page?"}
        description={
          pending?.action === "disable"
            ? `"${pending.row.recipientName || "This page"}" will show the unavailable screen to every visitor.`
            : `"${pending?.row.recipientName || "This page"}" goes back to the status it had before it was disabled.`
        }
        confirmLabel={pending?.action === "disable" ? "Disable page" : "Enable page"}
        destructive={pending?.action === "disable"}
        onConfirm={runPending}
      />
    </Card>
  );
}
