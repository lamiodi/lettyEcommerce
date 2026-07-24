import { Skeleton } from "@/components/ui/skeleton";
import { CosmeticCardSkeleton } from "@/components/shared/skeletons";

/**
 * Streaming skeleton for the homepage cosmetics rail. Matches the
 * ProductRail section spacing so layout shift is invisible to the eye.
 */
export function ProductRailSkeleton() {
  return (
    <section
      aria-hidden
      className="mx-auto max-w-7xl px-4 py-20 md:px-8 md:py-28"
    >
      <Skeleton className="h-10 w-44 md:h-12" />
      <div className="mt-8 py-10 md:py-12">
        <div className="grid grid-cols-2 gap-x-5 gap-y-12 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <CosmeticCardSkeleton key={i} />
          ))}
        </div>
      </div>
    </section>
  );
}
