import { Skeleton } from "@/components/ui/skeleton";
import { DataTableSkeleton } from "@/components/shared/skeletons";

export default function AdminTeamLoading() {
  return (
    <div className="space-y-4">
      <DataTableSkeleton rows={5} columns={4} />
    </div>
  );
}
