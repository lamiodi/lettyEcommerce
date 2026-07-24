import { Skeleton } from "@/components/ui/skeleton";
import { DataTableSkeleton } from "@/components/shared/skeletons";

export default function AdminInventoryLoading() {
  return (
    <div className="space-y-4">
      <DataTableSkeleton rows={10} columns={6} />
    </div>
  );
}
