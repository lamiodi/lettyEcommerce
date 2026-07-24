import { Skeleton } from "@/components/ui/skeleton";
import { ProductGridSkeleton } from "@/components/shared/skeletons";

export default function CollectionDetailLoading() {
  return (
    <div>
      {/* Hero banner */}
      <section className="relative overflow-hidden bg-ink">
        <div className="relative h-[46vh] min-h-[360px] w-full">
          <div className="absolute inset-0 bg-gradient-to-t from-ink/80 via-ink/30 to-ink/10" />
          <div className="absolute inset-0 flex items-end">
            <div className="mx-auto w-full max-w-7xl space-y-3 px-4 pb-12 md:px-8">
              <Skeleton className="h-3 w-24 bg-ivory/10" />
              <Skeleton className="h-12 w-2/3 bg-ivory/10 md:h-16" />
              <div className="max-w-xl space-y-1.5">
                <Skeleton className="h-3 w-full bg-ivory/10" />
                <Skeleton className="h-3 w-3/4 bg-ivory/10" />
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 py-12 md:px-8 md:py-16">
        <div className="flex items-center justify-between">
          <Skeleton className="h-3 w-28" />
          <Skeleton className="h-3 w-16" />
        </div>
        <div className="mt-8">
          <ProductGridSkeleton count={8} />
        </div>
      </div>
    </div>
  );
}
