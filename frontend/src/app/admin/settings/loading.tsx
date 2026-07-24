import { Skeleton } from "@/components/ui/skeleton";

export default function AdminSettingsLoading() {
  return (
    <div className="space-y-6">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="space-y-3 border border-line bg-ivory p-5">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-3 w-2/3" />
          <div className="space-y-2 pt-2">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );
}
