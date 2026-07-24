import { Skeleton } from "@/components/ui/skeleton";

export default function StoryLoading() {
  return (
    <div className="space-y-24 py-12 md:py-20">
      {/* Header */}
      <section className="mx-auto max-w-4xl px-4 text-center md:px-8">
        <Skeleton className="mx-auto h-3 w-36" />
        <Skeleton className="mx-auto mt-4 h-12 w-3/4 md:h-16" />
        <div className="mx-auto mt-4 max-w-xl space-y-2">
          <Skeleton className="mx-auto h-3 w-full" />
          <Skeleton className="mx-auto h-3 w-3/4" />
        </div>
      </section>

      {/* Hero image */}
      <section className="mx-auto max-w-6xl px-4 md:px-8">
        <Skeleton className="aspect-[21/9] w-full" />
      </section>

      {/* Timeline */}
      <section className="mx-auto max-w-4xl px-4 md:px-8">
        <div className="mb-16 text-center">
          <Skeleton className="mx-auto h-9 w-72" />
          <Skeleton className="mx-auto mt-4 h-px w-24" />
        </div>
        <div className="ml-4 space-y-12 border-l border-line pl-6 md:ml-12 md:pl-10">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-2.5 w-12" />
              <Skeleton className="h-7 w-1/2" />
              <div className="max-w-xl space-y-1.5">
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-3/4" />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Sustainability */}
      <section className="bg-ivory py-20">
        <div className="mx-auto grid max-w-5xl grid-cols-1 gap-12 px-4 md:grid-cols-2 md:px-8">
          <Skeleton className="aspect-square w-full" />
          <div className="space-y-4">
            <Skeleton className="h-2.5 w-32" />
            <Skeleton className="h-9 w-2/3" />
            <div className="space-y-2">
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-3/4" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-5/6" />
            </div>
            <Skeleton className="mt-2 h-9 w-44" />
          </div>
        </div>
      </section>
    </div>
  );
}
