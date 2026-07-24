import { Skeleton } from "@/components/ui/skeleton";

export default function AdminAnalyticsLoading() {
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <Skeleton className="h-7 w-32" />
        <div className="inline-flex items-center border border-line">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-8 w-12" />
          ))}
        </div>
      </div>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="space-y-3 border border-line bg-ivory p-5">
            <Skeleton className="h-4 w-32" />
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, j) => (
                <Skeleton key={j} className="h-9 w-full" />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
