"use client";

// EP-29 list + EP-30 activate/deactivate for platform users.
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/app/ConfirmDialog";
import { Button } from "@/components/ui/button";
import { Badge, Card, CardContent, Skeleton } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/client-api";
import { formatDate } from "@/lib/utils";

type UserRow = {
  id: string;
  name: string;
  email: string;
  role: "USER" | "ADMIN";
  isActive: boolean;
  createdAt: string;
  pagesCount: number;
};

type ListResponse<T> = {
  items: T[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

const LIMIT = 20;

export function UsersTable() {
  const [rows, setRows] = useState<UserRow[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [version, setVersion] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState<UserRow | null>(null);
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
      const data = await api<ListResponse<UserRow>>(`/admin/users?${params.toString()}`);
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

  // Flips the account state that was confirmed in the dialog.
  // Throwing keeps the ConfirmDialog open so the admin can retry.
  async function runPending() {
    if (!pending) return;
    const nextActive = !pending.isActive;
    setBusy(true);
    try {
      await api(`/admin/users/${pending.id}`, { method: "PATCH", body: { isActive: nextActive } });
      toast.success(nextActive ? "User activated." : "User deactivated.");
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
            placeholder="Search name or email"
            aria-label="Search users"
            className="sm:max-w-xs"
          />
          <p className="text-sm text-muted">
            {total.toLocaleString()} {total === 1 ? "user" : "users"}
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
                  <th className="px-3 py-2 font-medium">Name</th>
                  <th className="px-3 py-2 font-medium">Role</th>
                  <th className="px-3 py-2 font-medium">Account</th>
                  <th className="px-3 py-2 font-medium">Pages</th>
                  <th className="px-3 py-2 font-medium">Joined</th>
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
                          <span className="block font-medium text-ink">{row.name}</span>
                          <span className="block text-xs text-muted">{row.email}</span>
                        </td>
                        <td className="px-3 py-3">
                          <Badge tone={row.role === "ADMIN" ? "default" : "draft"}>
                            {row.role}
                          </Badge>
                        </td>
                        <td className="px-3 py-3">
                          <Badge tone={row.isActive ? "live" : "disabled"}>
                            {row.isActive ? "Active" : "Inactive"}
                          </Badge>
                        </td>
                        <td className="px-3 py-3 text-ink">{row.pagesCount.toLocaleString()}</td>
                        <td className="px-3 py-3 text-muted">{formatDate(row.createdAt)}</td>
                        <td className="px-3 py-3">
                          <Button
                            size="sm"
                            variant={row.isActive ? "danger" : "outline"}
                            className="h-11 px-4 text-sm"
                            disabled={busy}
                            onClick={() => setPending(row)}
                          >
                            {row.isActive ? "Deactivate" : "Activate"}
                          </Button>
                        </td>
                      </tr>
                    ))}
                {!loading && rows.length === 0 && (
                  <tr className="border-t border-border">
                    <td colSpan={6} className="px-3 py-8 text-center text-sm text-muted">
                      {query ? `No users match "${query}".` : "No users yet."}
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
        title={pending?.isActive ? "Deactivate this user?" : "Activate this user?"}
        description={
          pending?.isActive
            ? `${pending.name} will be signed out of every request until reactivated.`
            : `Restore access for ${pending?.name ?? "this user"}.`
        }
        confirmLabel={pending?.isActive ? "Deactivate" : "Activate"}
        destructive={!!pending?.isActive}
        onConfirm={runPending}
      />
    </Card>
  );
}
