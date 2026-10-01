import { Skeleton } from "@/components/ui/card";

// Skeleton for the admin area: six stats, the tab bar and the first table rows.
export default function AdminLoading() {
  return (
    <div className="w-full" role="status" aria-busy="true">
      <span className="sr-only">Loading the admin area</span>

      <Skeleton className="h-8 w-40" />
      <Skeleton className="mt-2 h-4 w-64" />

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className="rounded-card border border-border bg-white p-5 shadow-card">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="mt-3 h-8 w-20" />
          </div>
        ))}
      </div>

      <div className="mt-8 flex gap-2 overflow-hidden">
        {Array.from({ length: 5 }).map((_, index) => (
          <Skeleton key={index} className="h-11 w-24 rounded-full" />
        ))}
      </div>

      <div className="mt-4 overflow-hidden rounded-card border border-border bg-white shadow-card">
        <div className="flex items-center gap-4 border-b border-border px-5 py-4">
          <Skeleton className="h-4 w-1/4" />
          <Skeleton className="h-4 w-1/4" />
          <Skeleton className="h-4 w-1/4" />
          <Skeleton className="h-4 w-1/5" />
        </div>
        {Array.from({ length: 6 }).map((_, index) => (
          <div
            key={index}
            className="flex items-center gap-4 border-b border-border px-5 py-4 last:border-b-0"
          >
            <Skeleton className="h-4 w-1/4" />
            <Skeleton className="h-4 w-1/4" />
            <Skeleton className="h-6 w-20 rounded-full" />
            <Skeleton className="ml-auto h-9 w-24 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  );
}
