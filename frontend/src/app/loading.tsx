import { Skeleton } from "@/components/ui/skeleton";
import { CenteredLoader } from "@/components/shared/skeletons";

/** Root loading — used by Next.js when no closer loading.tsx is matched. */
export default function Loading() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-6 py-24 text-center">
      <Skeleton className="h-12 w-12" />
      <CenteredLoader label="Preparing Sanctuary" />
    </div>
  );
}
