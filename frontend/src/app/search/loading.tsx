import { Skeleton } from "@/components/ui/skeleton";
import { ProductGridSkeleton, SectionHeaderSkeleton } from "@/components/shared/skeletons";

export default function SearchLoading() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-12 md:px-8 md:py-16">
      <SectionHeaderSkeleton />
      <div className="mt-10">
        <ProductGridSkeleton count={8} />
      </div>
    </div>
  );
}
