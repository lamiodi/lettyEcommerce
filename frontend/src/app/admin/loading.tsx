import { Skeleton } from "@/components/ui/skeleton";
import {
  KpiTileSkeleton,
  ListRowSkeleton,
} from "@/components/shared/skeletons";

export default function AdminDashboardLoading() {
  return (
    <div className="space-y-8">
      {/* Today KPIs */}
      <section>
        <Skeleton className="mb-4 h-2.5 w-12" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <KpiTileSkeleton key={i} />
          ))}
        </div>
      </section>

      {/* Live orders + low stock */}
      <section className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="border border-line bg-ivory lg:col-span-2">
          <div className="flex items-center justify-between border-b border-line px-4 py-3">
            <Skeleton className="h-2.5 w-20" />
            <Skeleton className="h-2.5 w-12" />
          </div>
          {Array.from({ length: 6 }).map((_, i) => (
            <ListRowSkeleton key={i} />
          ))}
        </div>
        <div className="border border-line bg-ivory">
          <div className="flex items-center justify-between border-b border-line px-4 py-3">
            <Skeleton className="h-2.5 w-16" />
            <Skeleton className="h-2.5 w-12" />
          </div>
          {Array.from({ length: 4 }).map((_, i) => (
            <ListRowSkeleton key={i} withImage />
          ))}
        </div>
      </section>
    </div>
  );
}
