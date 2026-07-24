import { Skeleton } from "@/components/ui/skeleton";

export default function CollectionsLoading() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-12 md:px-8 md:py-16">
      <header className="mx-auto max-w-2xl text-center">
        <Skeleton className="mx-auto h-3 w-24" />
        <Skeleton className="mx-auto mt-3 h-10 w-48 md:h-12" />
        <Skeleton className="mx-auto mt-6 h-px w-24" />
        <div className="mx-auto mt-4 max-w-md space-y-2">
          <Skeleton className="mx-auto h-3 w-full" />
          <Skeleton className="mx-auto h-3 w-3/4" />
        </div>
      </header>

      <div className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 md:gap-5">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="space-y-4">
            <Skeleton className="aspect-[4/5] w-full" />
            <div className="space-y-2 px-2">
              <Skeleton className="h-2.5 w-16" />
              <Skeleton className="h-5 w-2/3" />
              <Skeleton className="h-3 w-full" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
