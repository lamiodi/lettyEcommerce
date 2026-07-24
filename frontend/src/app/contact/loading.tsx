import { Skeleton } from "@/components/ui/skeleton";

export default function ContactLoading() {
  return (
    <div className="mx-auto max-w-7xl space-y-20 px-4 py-12 md:px-8 md:py-20">
      {/* Header */}
      <header className="mx-auto max-w-3xl space-y-3 text-center">
        <Skeleton className="mx-auto h-3 w-40" />
        <Skeleton className="mx-auto h-10 w-56 md:h-12" />
        <div className="mx-auto mt-3 max-w-xl space-y-2">
          <Skeleton className="mx-auto h-3 w-full" />
          <Skeleton className="mx-auto h-3 w-2/3" />
        </div>
      </header>

      {/* Form + sidebar */}
      <div className="grid grid-cols-1 gap-12 lg:grid-cols-12">
        <div className="space-y-6 bg-ivory p-6 md:p-10 lg:col-span-7">
          <Skeleton className="h-7 w-40" />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-2.5 w-20" />
                <Skeleton className="h-11 w-full" />
              </div>
            ))}
          </div>
          <div className="space-y-2">
            <Skeleton className="h-2.5 w-24" />
            <Skeleton className="h-24 w-full" />
          </div>
          <div className="flex justify-center pt-2">
            <Skeleton className="h-10 w-44" />
          </div>
        </div>

        <div className="space-y-8 lg:col-span-5">
          <div className="space-y-6 bg-ivory p-6 md:p-8">
            <Skeleton className="h-6 w-56 border-b border-line pb-3" />
            <div className="space-y-5">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex items-start gap-3">
                  <Skeleton className="mt-0.5 h-3.5 w-3.5" />
                  <div className="flex-1 space-y-1.5">
                    <Skeleton className="h-2.5 w-28" />
                    <Skeleton className="h-3 w-40" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Boutiques */}
      <section className="pt-12">
        <div className="mx-auto mb-12 max-w-xl text-center">
          <Skeleton className="mx-auto h-3 w-32" />
          <Skeleton className="mx-auto mt-2 h-8 w-56" />
        </div>
        <div className="grid grid-cols-1 gap-x-5 gap-y-10 md:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="space-y-3 text-center">
              <Skeleton className="mx-auto h-2.5 w-16" />
              <Skeleton className="mx-auto h-6 w-32" />
              <Skeleton className="mx-auto h-3 w-44" />
              <Skeleton className="mx-auto h-2.5 w-28" />
              <Skeleton className="mx-auto h-3 w-24" />
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
