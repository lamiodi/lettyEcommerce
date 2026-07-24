import { Skeleton } from "@/components/ui/skeleton";

export default function ShopLoading() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-12 md:px-8 md:py-16">
      {/* Page header */}
      <div className="max-w-2xl space-y-3">
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-12 w-64" />
        <Skeleton className="h-4 w-full max-w-md" />
      </div>

      <div className="mt-10 flex flex-col gap-10 lg:flex-row">
        {/* Filter sidebar skeleton */}
        <aside className="hidden lg:block w-56 shrink-0 space-y-6">
          <Skeleton className="h-5 w-24" />
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-8 w-full rounded-lg" />
            ))}
          </div>
          <Skeleton className="h-5 w-20" />
          <div className="space-y-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-8 w-full rounded-lg" />
            ))}
          </div>
        </aside>

        {/* Product grid skeleton */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-9 w-36 rounded-lg" />
          </div>
          <div className="mt-8 grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-3 md:gap-x-5 xl:grid-cols-4">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="space-y-3">
                <Skeleton className="aspect-[3/4] w-full rounded-xl" />
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-16" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
