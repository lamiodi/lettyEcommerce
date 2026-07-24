import { Skeleton } from "@/components/ui/skeleton";
import { DataTableSkeleton } from "@/components/shared/skeletons";

export default function AdminShippingLoading() {
  return (
    <div className="space-y-6">
      <div className="border border-line bg-ivory p-5">
        <Skeleton className="h-4 w-40" />
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </div>
        <Skeleton className="mt-4 h-9 w-32" />
      </div>
      <DataTableSkeleton rows={6} columns={4} />
    </div>
  );
}
