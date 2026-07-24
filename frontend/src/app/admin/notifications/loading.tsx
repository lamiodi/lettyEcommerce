import { Skeleton } from "@/components/ui/skeleton";
import { ListRowSkeleton } from "@/components/shared/skeletons";

export default function AdminNotificationsLoading() {
  return (
    <div className="space-y-4">
      <div className="border border-line bg-ivory">
        {Array.from({ length: 6 }).map((_, i) => (
          <ListRowSkeleton key={i} withImage />
        ))}
      </div>
    </div>
  );
}
