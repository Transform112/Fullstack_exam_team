import { Skeleton } from "@/components/ui/card";

// Skeleton for the insights page: three stat cards, the 30 day chart and the wish list.
export default function InsightsLoading() {
  return (
    <div className="mx-auto w-full max-w-[1100px] px-5 py-10" role="status" aria-busy="true">
      <span className="sr-only">Loading insights</span>

      <Skeleton className="h-4 w-28" />
      <Skeleton className="mt-3 h-8 w-56" />

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={index} className="rounded-card border border-border bg-white p-5 shadow-card">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="mt-3 h-8 w-20" />
          </div>
        ))}
      </div>

      <div className="mt-6 rounded-card border border-border bg-white p-5 shadow-card">
        <Skeleton className="h-5 w-40" />
        <Skeleton className="mt-4 h-64 w-full rounded-xl" />
      </div>

      <div className="mt-6 rounded-card border border-border bg-white p-5 shadow-card">
        <Skeleton className="h-5 w-44" />
        <div className="mt-4 flex flex-col gap-3">
          {Array.from({ length: 4 }).map((_, index) => (
            <div
              key={index}
              className="flex items-center gap-3 rounded-xl border border-border p-3"
            >
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="flex-1">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="mt-2 h-4 w-2/3" />
              </div>
              <Skeleton className="h-9 w-9 rounded-full" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
