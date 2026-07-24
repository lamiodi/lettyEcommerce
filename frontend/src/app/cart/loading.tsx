import { Skeleton } from "@/components/ui/skeleton";
import {
  CartLineItemSkeleton,
  OrderSummarySkeleton,
} from "@/components/shared/skeletons";

export default function CartLoading() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-12 md:px-8 md:py-16">
      {/* Header */}
      <header className="space-y-2">
        <Skeleton className="h-3 w-28" />
        <Skeleton className="h-10 w-56 md:h-12" />
        <Skeleton className="h-3 w-20" />
      </header>

      <div className="mt-10 grid grid-cols-1 gap-12 lg:grid-cols-12">
        {/* Lines */}
        <div className="lg:col-span-7">
          <Skeleton className="h-1.5 w-full" />
          <ul className="mt-6 flex flex-col gap-6">
            {Array.from({ length: 3 }).map((_, i) => (
              <li key={i}>
                <CartLineItemSkeleton variant="page" />
              </li>
            ))}
          </ul>
          {/* Coupon input */}
          <div className="mt-10 flex max-w-md items-center gap-3">
            <Skeleton className="h-11 flex-1" />
            <Skeleton className="h-3 w-12" />
          </div>
        </div>

        {/* Summary */}
        <aside className="lg:col-span-5">
          <div className="lg:sticky lg:top-28">
            <OrderSummarySkeleton />
          </div>
        </aside>
      </div>

      {/* Recommendations */}
      <section className="mt-20 space-y-10 border-t border-line pt-16">
        <div className="flex flex-col items-start gap-2">
          <Skeleton className="h-2.5 w-24" />
          <Skeleton className="h-8 w-56" />
          <Skeleton className="h-px w-24" />
        </div>
        <div className="grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-4 md:gap-x-5">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="space-y-3">
              <Skeleton className="aspect-[3/4] w-full" />
              <Skeleton className="mx-auto h-3 w-16" />
              <Skeleton className="mx-auto h-3.5 w-2/3" />
              <Skeleton className="mx-auto h-3 w-10" />
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
