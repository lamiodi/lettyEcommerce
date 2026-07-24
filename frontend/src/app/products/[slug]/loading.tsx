import { Skeleton } from "@/components/ui/skeleton";
import {
  ProductGallerySkeleton,
  PurchasePanelSkeleton,
  ProductGridSkeleton,
  ReviewsSkeleton,
} from "@/components/shared/skeletons";

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
        <ProductGallerySkeleton />
        <div className="space-y-10">
          <PurchasePanelSkeleton />
          <Skeleton className="h-px w-full" />
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        </div>
      </div>

      {/* Reviews */}
      <section className="mt-20 space-y-10 border-t border-line pt-16">
        <div className="space-y-2">
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-8 w-56" />
        </div>
        <ReviewsSkeleton count={2} />
      </section>

      {/* Complete the look */}
      <section className="mt-20 space-y-8 border-t border-line pt-16">
        <div className="space-y-2">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-8 w-56" />
        </div>
        <ProductGridSkeleton count={4} />
      </section>

      {/* Related */}
      <section className="mt-20 space-y-8 border-t border-line pt-16">
        <div className="space-y-2">
          <Skeleton className="h-3 w-28" />
          <Skeleton className="h-8 w-56" />
        </div>
        <ProductGridSkeleton count={4} />
      </section>
    </div>
  );
}
