import { Skeleton } from "@/components/ui/skeleton";
import { DataTableSkeleton } from "@/components/shared/skeletons";

export default function AdminBannersLoading() {
  return (
    <div className="space-y-4">
      <DataTableSkeleton rows={4} columns={4} />
    </div>
  );
}
