import { Skeleton } from "@/components/ui/skeleton";
import { DataTableSkeleton } from "@/components/shared/skeletons";

export default function AdminCouponsLoading() {
  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Skeleton className="h-10 w-32" />
      </div>
      <DataTableSkeleton rows={6} columns={5} />
    </div>
  );
}
