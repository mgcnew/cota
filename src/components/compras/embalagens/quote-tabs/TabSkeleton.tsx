import { Skeleton } from "@/components/ui/skeleton";

export function TabSkeleton() {
  return (
    <div className="p-4 space-y-3 animate-in fade-in duration-300">
      {/* Header skeleton */}
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-48" />
        <Skeleton className="h-6 w-20 rounded-md" />
      </div>
      {/* Card skeleton */}
      <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="px-4 py-3 border-b border-zinc-100 dark:border-zinc-800 last:border-0">
            <div className="flex items-center justify-between gap-4">
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-40" />
                <div className="flex gap-1.5">
                  <Skeleton className="h-5 w-24 rounded-md" />
                  <Skeleton className="h-5 w-28 rounded-md" />
                </div>
              </div>
              <div className="space-y-1.5 text-right">
                <Skeleton className="h-5 w-20 ml-auto" />
                <Skeleton className="h-3 w-16 ml-auto" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function ValoresTabSkeleton() {
  return (
    <div className="h-full flex flex-col md:flex-row">
      {/* Sidebar skeleton */}
      <div className="w-full md:w-48 flex-shrink-0 border-b md:border-b-0 md:border-r border-zinc-200 dark:border-zinc-800 bg-zinc-50/20 dark:bg-zinc-900/20 p-2 space-y-1">
        <Skeleton className="h-3 w-20 mb-2 mx-1" />
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-9 w-full rounded-md" />
        ))}
      </div>
      {/* Content skeleton */}
      <div className="flex-1 p-3 space-y-3">
        {[1, 2].map((i) => (
          <div key={i} className="rounded-xl border border-zinc-200 dark:border-zinc-800 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Skeleton className="h-8 w-8 rounded-lg" />
                <Skeleton className="h-4 w-36" />
              </div>
              <Skeleton className="h-7 w-16 rounded-md" />
            </div>
            <div className="grid grid-cols-4 gap-3">
              {[1, 2, 3, 4].map((j) => (
                <div key={j} className="space-y-1">
                  <Skeleton className="h-3 w-16" />
                  <Skeleton className="h-5 w-20" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
