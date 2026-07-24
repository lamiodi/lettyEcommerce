import { Skeleton } from "@/components/ui/skeleton";

export default function AdminCatalogLoading() {
  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="space-y-3 border border-line bg-ivory p-5">
            <Skeleton className="h-4 w-32" />
            <div className="space-y-2">
              {Array.from({ length: 4 }).map((_, j) => (
                <div key={j} className="flex items-center justify-between border-b border-line pb-2 last:border-0">
                  <Skeleton className="h-3 w-32" />
                  <Skeleton className="h-3 w-12" />
                </div>
              ))}
            </div>
            <div className="flex gap-2 pt-2">
              <Skeleton className="h-8 w-16" />
              <Skeleton className="h-8 w-16" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
