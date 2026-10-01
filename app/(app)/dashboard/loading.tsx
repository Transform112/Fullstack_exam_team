import { Skeleton } from "@/components/ui/card";

// Skeleton shown while the dashboard page streams in (docs/03 P4-14).
export default function DashboardLoading() {
  return (
    <div className="mx-auto w-full max-w-[1100px] px-5 py-10" role="status" aria-busy="true">
      <span className="sr-only">Loading your pages</span>

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <Skeleton className="h-8 w-44" />
          <Skeleton className="mt-2 h-4 w-56" />
        </div>
        <Skeleton className="h-11 w-40 rounded-full" />
      </div>

      <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className="rounded-card border border-border bg-white p-4 shadow-card">
            <Skeleton className="h-40 w-full rounded-xl" />
            <Skeleton className="mt-4 h-5 w-2/3" />
            <div className="mt-3 flex gap-2">
              <Skeleton className="h-6 w-20 rounded-full" />
              <Skeleton className="h-6 w-16 rounded-full" />
            </div>
            <div className="mt-4 flex items-center justify-between">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-9 w-24 rounded-full" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
