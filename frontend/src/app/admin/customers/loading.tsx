import { Skeleton } from "@/components/ui/skeleton";
import { DataTableSkeleton } from "@/components/shared/skeletons";

export default function AdminCustomersLoading() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Skeleton className="h-10 w-72" />
        <Skeleton className="h-10 w-32" />
      </div>
      <DataTableSkeleton rows={10} columns={5} />
    </div>
  );
}
