import { Skeleton } from "@/components/ui/skeleton";

export default function FaqLoading() {
  return (
    <div className="mx-auto max-w-4xl space-y-12 px-4 py-12 md:px-8 md:py-20">
      <header className="space-y-3 text-center">
        <Skeleton className="mx-auto h-3 w-28" />
        <Skeleton className="mx-auto h-10 w-72 md:h-12" />
        <div className="mx-auto max-w-lg space-y-2 pt-1">
          <Skeleton className="mx-auto h-3 w-full" />
          <Skeleton className="mx-auto h-3 w-2/3" />
        </div>
        <Skeleton className="mx-auto mt-6 h-12 w-full max-w-md" />
      </header>

      {/* Category tabs */}
      <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-2.5 w-20" />
        ))}
      </div>

      {/* Accordion list */}
      <div className="space-y-0 pt-4">
        {Array.from({ length: 7 }).map((_, i) => (
          <div key={i} className="border-b border-line py-5">
            <div className="flex items-center justify-between">
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="h-3 w-3" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
