import { Skeleton } from "@/components/ui/skeleton";
import { DataTableSkeleton } from "@/components/shared/skeletons";

export default function AdminReviewsLoading() {
  return (
    <div className="space-y-4">
      <DataTableSkeleton rows={6} columns={4} />
    </div>
  );
}
