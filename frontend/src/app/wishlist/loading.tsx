import { Skeleton } from "@/components/ui/skeleton";
import { ProductGridSkeleton } from "@/components/shared/skeletons";

export default function WishlistLoading() {
  return (
    <div className="mx-auto max-w-7xl space-y-10 px-4 py-12 md:px-8 md:py-16">
      <header className="flex flex-col items-start justify-between gap-4 border-b border-line pb-6 sm:flex-row sm:items-end">
        <div className="space-y-2">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-10 w-48 md:h-12" />
          <Skeleton className="h-3 w-32" />
        </div>
        <Skeleton className="h-3 w-28" />
      </header>

      <ProductGridSkeleton count={4} className="!grid-cols-1 sm:!grid-cols-2 lg:!grid-cols-4" />
    </div>
  );
}
