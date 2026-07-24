import { Skeleton } from "@/components/ui/skeleton";

export default function AboutLoading() {
  return (
    <div className="space-y-24 py-12 md:py-20">
      {/* Hero text */}
      <section className="mx-auto max-w-5xl px-4 text-center md:px-8">
        <Skeleton className="mx-auto h-3 w-32" />
        <Skeleton className="mx-auto mt-4 h-12 w-3/4 md:h-16" />
        <div className="mx-auto mt-6 max-w-2xl space-y-2">
          <Skeleton className="mx-auto h-3 w-full" />
          <Skeleton className="mx-auto h-3 w-3/4" />
        </div>
      </section>

      {/* Cinematic banner */}
      <Skeleton className="h-[65vh] min-h-[450px] w-full" />

      {/* Narrative */}
      <section className="mx-auto max-w-4xl px-4 md:px-8">
        <div className="grid grid-cols-1 gap-12 md:grid-cols-2">
          <div className="space-y-3">
            <Skeleton className="h-9 w-3/4" />
            <div className="space-y-2">
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-11/12" />
              <Skeleton className="h-3 w-4/5" />
            </div>
            <div className="space-y-2 pt-2">
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-3/4" />
            </div>
          </div>
          <Skeleton className="aspect-[4/5] w-full" />
        </div>
      </section>

      {/* Three pillars */}
      <section className="bg-ivory py-20">
        <div className="mx-auto max-w-7xl px-4 md:px-8">
          <div className="mx-auto mb-16 max-w-2xl text-center">
            <Skeleton className="mx-auto h-3 w-24" />
            <Skeleton className="mx-auto mt-3 h-10 w-1/2" />
          </div>
          <div className="grid grid-cols-1 gap-x-5 gap-y-12 md:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="space-y-4">
                <Skeleton className="aspect-[4/3] w-full" />
                <Skeleton className="mx-auto h-5 w-2/3" />
                <div className="mx-auto max-w-xs space-y-1.5">
                  <Skeleton className="h-2.5 w-full" />
                  <Skeleton className="mx-auto h-2.5 w-3/4" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="mx-auto max-w-6xl px-4 md:px-8">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="p-4 text-center">
              <Skeleton className="mx-auto h-10 w-20 md:h-12" />
              <Skeleton className="mx-auto mt-3 h-2.5 w-24" />
            </div>
          ))}
        </div>
      </section>

      {/* Quote */}
      <section className="mx-auto max-w-4xl px-4 md:px-8">
        <div className="space-y-4 border-y border-line py-12 text-center">
          <Skeleton className="mx-auto h-6 w-3/4" />
          <Skeleton className="mx-auto h-6 w-1/2" />
          <Skeleton className="mx-auto mt-6 h-2.5 w-40" />
        </div>
      </section>
    </div>
  );
}
