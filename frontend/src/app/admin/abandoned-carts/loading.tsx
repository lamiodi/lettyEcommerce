import { Skeleton } from "@/components/ui/skeleton";
import { DataTableSkeleton } from "@/components/shared/skeletons";

export default function AdminAbandonedCartsLoading() {
  return (
    <div className="space-y-4">
      <DataTableSkeleton rows={8} columns={5} />
    </div>
  );
}
