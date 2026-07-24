import { Skeleton } from "@/components/ui/skeleton";

export default function CheckoutSuccessLoading() {
  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-16 text-center md:py-24">
      <Skeleton className="mx-auto h-20 w-20" />
      <Skeleton className="mx-auto h-3 w-28" />
      <Skeleton className="mx-auto h-10 w-72 md:h-12" />
      <div className="mx-auto max-w-md space-y-2">
        <Skeleton className="mx-auto h-3 w-full" />
        <Skeleton className="mx-auto h-3 w-3/4" />
      </div>
      <div className="mt-10 flex justify-center">
        <Skeleton className="h-12 w-56" />
      </div>
    </div>
  );
}
