import { Skeleton } from "@/components/ui/skeleton";
import {
  CartLineItemSkeleton,
  OrderSummarySkeleton,
} from "@/components/shared/skeletons";

export default function CheckoutLoading() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-10 md:px-8 md:py-14">
      <div className="mb-8 flex items-center justify-center gap-3">
        <Skeleton className="h-2.5 w-16" />
        <Skeleton className="h-2.5 w-16" />
        <Skeleton className="h-2.5 w-16" />
      </div>

      <div className="grid grid-cols-1 gap-10 lg:grid-cols-12">
        {/* Form */}
        <div className="space-y-6 lg:col-span-7">
          <div className="space-y-4 border border-line bg-ivory p-6">
            <Skeleton className="h-5 w-40" />
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="h-2.5 w-20" />
                  <Skeleton className="h-11 w-full" />
                </div>
              ))}
            </div>
            <div className="space-y-2">
              <Skeleton className="h-2.5 w-16" />
              <Skeleton className="h-11 w-full" />
            </div>
          </div>

          <div className="space-y-4 border border-line bg-ivory p-6">
            <Skeleton className="h-5 w-44" />
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-14 w-full" />
              ))}
            </div>
          </div>

          <div className="space-y-4 border border-line bg-ivory p-6">
            <Skeleton className="h-5 w-32" />
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-2">
                <Skeleton className="h-2.5 w-16" />
                <Skeleton className="h-11 w-full" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-2.5 w-12" />
                <Skeleton className="h-11 w-full" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-2.5 w-16" />
                <Skeleton className="h-11 w-full" />
              </div>
            </div>
          </div>
        </div>

        {/* Summary */}
        <aside className="lg:col-span-5">
          <div className="space-y-4 border border-line bg-ivory p-6 lg:sticky lg:top-28">
            <Skeleton className="h-5 w-40" />
            <ul className="space-y-3">
              {Array.from({ length: 2 }).map((_, i) => (
                <li key={i}>
                  <CartLineItemSkeleton variant="drawer" />
                </li>
              ))}
            </ul>
            <Skeleton className="h-px w-full" />
            <OrderSummarySkeleton />
          </div>
        </aside>
      </div>
    </div>
  );
}
