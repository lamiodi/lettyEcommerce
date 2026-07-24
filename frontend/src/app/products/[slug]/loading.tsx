import { Skeleton } from "@/components/ui/skeleton";

export default function ProductLoading() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 md:px-8 md:py-12">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2">
        <Skeleton className="h-3 w-10" />
        <Skeleton className="h-3 w-2" />
        <Skeleton className="h-3 w-10" />
        <Skeleton className="h-3 w-2" />
        <Skeleton className="h-3 w-28" />
      </div>

      <div className="mt-8 grid grid-cols-1 gap-10 lg:grid-cols-2 lg:gap-16">
        {/* Gallery skeleton */}
        <div className="space-y-3">
          <Skeleton className="aspect-[4/5] w-full rounded-2xl" />
          <div className="flex gap-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-16 rounded-lg" />
            ))}
          </div>
        </div>

        {/* Purchase panel skeleton */}
        <div className="space-y-4">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-9 w-3/4" />
          <Skeleton className="h-6 w-24" />
          <div className="flex gap-2 pt-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-16 rounded-lg" />
            ))}
          </div>
          <Skeleton className="h-14 w-full rounded-lg" />
          <Skeleton className="h-14 w-full rounded-lg" />
          <div className="space-y-2 pt-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
