import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

/**
 * Skeleton primitives — composable, on-brand loading placeholders that
 * mirror the dimensions and rhythm of the real components they replace.
 * All variants follow the LETTY design rules: no rounded corners, hairline
 * structure, ink-on-ivory tonal palette.
 */

interface ProductCardSkeletonProps {
  className?: string;
  /** Show the "Add to cart" rule + button area. */
  withAction?: boolean;
}

/** PLP / homepage card placeholder. Mirrors ProductCard dimensions. */
export function ProductCardSkeleton({
  className,
  withAction = true,
}: ProductCardSkeletonProps) {
  return (
    <div className={cn("group flex flex-col", className)}>
      <Skeleton className="aspect-[3/4] w-full" />
      <div className="flex flex-col items-center gap-2 pt-4 sm:pt-5">
        <Skeleton className="h-2.5 w-16" />
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-20" />
        <Skeleton className="mt-1 h-4 w-12" />
      </div>
      {withAction ? (
        <div className="mt-4 w-full">
          <Skeleton className="h-px w-full" />
          <Skeleton className="mx-auto mt-3 h-3 w-20" />
          <Skeleton className="mt-3 h-px w-full" />
        </div>
      ) : null}
    </div>
  );
}

/** Compact product card used in homepage cosmetics rail. */
export function CosmeticCardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("flex h-full flex-col", className)}>
      <Skeleton className="aspect-square w-full" />
      <Skeleton className="mx-auto mt-3 h-3.5 w-3/4" />
      <Skeleton className="mx-auto mt-1 h-3.5 w-1/3" />
      <div className="mt-3 w-full">
        <Skeleton className="h-px w-full" />
        <Skeleton className="mx-auto mt-3 h-3 w-20" />
        <Skeleton className="mt-3 h-px w-full" />
      </div>
    </div>
  );
}

interface ProductGridSkeletonProps {
  count?: number;
  className?: string;
  variant?: "default" | "compact";
}

/** Responsive 2/3/4-column product grid skeleton. */
export function ProductGridSkeleton({
  count = 8,
  className,
  variant = "default",
}: ProductGridSkeletonProps) {
  const Item = variant === "compact" ? CosmeticCardSkeleton : ProductCardSkeleton;
  return (
    <div
      className={cn(
        "grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-3 md:gap-x-5 xl:grid-cols-4",
        className,
      )}
    >
      {Array.from({ length: count }).map((_, i) => (
        <Item key={i} />
      ))}
    </div>
  );
}

/** Text line — for paragraph blocks, descriptions, bios. */
export function TextSkeleton({
  lines = 3,
  className,
  lastWidth = "w-2/3",
}: {
  lines?: number;
  className?: string;
  lastWidth?: string;
}) {
  return (
    <div className={cn("space-y-2", className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          className={cn("h-3", i === lines - 1 ? lastWidth : "w-full")}
        />
      ))}
    </div>
  );
}

/** Eyebrow + heading + paragraph header. */
export function SectionHeaderSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("space-y-3", className)}>
      <Skeleton className="h-3 w-24" />
      <Skeleton className="h-10 w-2/3 md:h-12" />
      <Skeleton className="h-3 w-full max-w-md" />
    </div>
  );
}

/** Cart line item — used in drawer and full cart page. */
export function CartLineItemSkeleton({
  className,
  variant = "drawer",
}: {
  className?: string;
  variant?: "drawer" | "page";
}) {
  const isPage = variant === "page";
  return (
    <div
      className={cn(
        "flex gap-4",
        isPage && "border border-line bg-ivory p-4",
        className,
      )}
    >
      <Skeleton className={cn("shrink-0", isPage ? "h-28 w-24" : "h-24 w-[4.5rem]")} />
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1 space-y-1.5">
            <Skeleton className="h-3.5 w-3/4" />
            <Skeleton className="h-2.5 w-1/3" />
          </div>
          <Skeleton className="h-5 w-5 shrink-0" />
        </div>
        <div className="mt-auto flex items-end justify-between pt-2">
          <Skeleton className="h-7 w-20" />
          <Skeleton className="h-3.5 w-12" />
        </div>
      </div>
    </div>
  );
}

/** Cart drawer summary panel. */
export function CartDrawerSkeleton() {
  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-line px-6 py-5">
        <Skeleton className="h-5 w-32" />
      </div>
      <div className="flex-1 space-y-5 overflow-y-auto px-6 py-5">
        {Array.from({ length: 3 }).map((_, i) => (
          <CartLineItemSkeleton key={i} variant="drawer" />
        ))}
      </div>
      <div className="space-y-4 border-t border-line bg-ivory px-6 py-5">
        <div className="flex items-baseline justify-between">
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-5 w-20" />
        </div>
        <Skeleton className="mx-auto h-9 w-full max-w-[260px]" />
        <Skeleton className="mx-auto h-2.5 w-24" />
      </div>
    </div>
  );
}

/** Order summary aside — used in cart and checkout. */
export function OrderSummarySkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("space-y-5", className)}>
      <Skeleton className="h-5 w-32 border-b border-line pb-4" />
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex justify-between">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-3 w-14" />
          </div>
        ))}
      </div>
      <div className="space-y-2 border-t border-line pt-4">
        <div className="flex justify-between">
          <Skeleton className="h-4 w-12" />
          <Skeleton className="h-6 w-24" />
        </div>
      </div>
      <Skeleton className="mx-auto h-10 w-full max-w-[240px]" />
    </div>
  );
}

/** Admin KPI tile. */
export function KpiTileSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("border border-line bg-ivory p-5", className)}>
      <div className="mb-3 flex items-center justify-between">
        <Skeleton className="h-2.5 w-20" />
        <Skeleton className="h-3.5 w-3.5" />
      </div>
      <Skeleton className="h-7 w-24" />
      <Skeleton className="mt-2 h-2.5 w-16" />
    </div>
  );
}

/** Admin list rows — used for live orders, low stock, notifications. */
export function ListRowSkeleton({
  className,
  withImage = false,
}: {
  className?: string;
  withImage?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex items-center gap-3 border-b border-line px-4 py-3 last:border-0",
        className,
      )}
    >
      {withImage ? <Skeleton className="h-10 w-10 shrink-0" /> : null}
      <div className="min-w-0 flex-1 space-y-1.5">
        <Skeleton className="h-3 w-1/2" />
        <Skeleton className="h-2.5 w-1/3" />
      </div>
      <Skeleton className="h-3 w-12" />
    </div>
  );
}

/** Admin data table rows skeleton. */
export function DataTableSkeleton({
  rows = 8,
  columns = 5,
  className,
}: {
  rows?: number;
  columns?: number;
  className?: string;
}) {
  return (
    <div className={cn("border border-line bg-ivory", className)}>
      <div className="border-b border-line">
        <div className="flex px-4 py-3">
          {Array.from({ length: columns }).map((_, i) => (
            <Skeleton
              key={i}
              className="mx-2 h-2.5 flex-1 last:hidden"
              style={{ maxWidth: 120 }}
            />
          ))}
        </div>
      </div>
      <div>
        {Array.from({ length: rows }).map((_, i) => (
          <div
            key={i}
            className="flex border-b border-line px-4 py-3 last:border-0"
          >
            {Array.from({ length: columns }).map((_, j) => (
              <Skeleton key={j} className="mx-2 h-3 flex-1" />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

/** Product gallery skeleton — large stage plus thumbnail rail. */
export function ProductGallerySkeleton() {
  return (
    <div className="flex flex-col gap-3">
      <Skeleton className="aspect-[4/5] w-full" />
      <div className="flex gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-20 w-16" />
        ))}
      </div>
    </div>
  );
}

/** Purchase panel skeleton — title, price, variants, actions. */
export function PurchasePanelSkeleton() {
  return (
    <div className="space-y-5">
      <Skeleton className="h-2.5 w-20" />
      <Skeleton className="h-8 w-3/4" />
      <Skeleton className="h-3 w-24" />
      <Skeleton className="h-5 w-20" />
      <div className="space-y-2 pt-2">
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-5/6" />
        <Skeleton className="h-3 w-4/6" />
      </div>
      <div className="space-y-3 pt-3">
        <Skeleton className="h-2.5 w-16" />
        <div className="flex flex-wrap gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-9 w-9" />
          ))}
        </div>
      </div>
      <div className="flex items-stretch gap-3 pt-2">
        <Skeleton className="h-10 w-28" />
        <Skeleton className="h-10 flex-1" />
        <Skeleton className="h-10 w-10" />
        <Skeleton className="h-10 w-10" />
      </div>
      <div className="space-y-3 border-t border-line pt-6">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3">
            <Skeleton className="h-3.5 w-3.5" />
            <Skeleton className="h-2.5 w-2/3" />
          </div>
        ))}
      </div>
    </div>
  );
}

/** Reviews summary + list skeleton. */
export function ReviewsSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 gap-10 lg:grid-cols-12">
      <div className="lg:col-span-4">
        <div className="bg-secondary/60 p-8 text-center">
          <Skeleton className="mx-auto h-10 w-20" />
          <Skeleton className="mx-auto mt-3 h-3 w-24" />
          <Skeleton className="mx-auto mt-3 h-2.5 w-32" />
        </div>
      </div>
      <ul className="flex flex-col gap-6 lg:col-span-8">
        {Array.from({ length: count }).map((_, i) => (
          <li key={i} className="border border-line bg-card p-6">
            <div className="flex items-center justify-between">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-2.5 w-16" />
            </div>
            <Skeleton className="mt-3 h-3.5 w-1/2" />
            <div className="mt-2 space-y-1.5">
              <Skeleton className="h-2.5 w-full" />
              <Skeleton className="h-2.5 w-11/12" />
              <Skeleton className="h-2.5 w-4/5" />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Hero skeleton — for the home hero, collection banner. */
export function HeroSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "relative flex min-h-[88svh] items-end justify-center overflow-hidden bg-ink/95",
        className,
      )}
    >
      <div className="relative z-10 ml-auto mr-0 flex w-full max-w-3xl flex-col items-end gap-4 px-4 pb-[23vh] pt-32 text-right md:mr-12 md:pb-[21vh] lg:mr-20 lg:pb-[19vh]">
        <Skeleton className="h-16 w-48 bg-ivory/10 md:h-24" />
        <Skeleton className="h-7 w-64 bg-ivory/10 md:h-9" />
        <div className="mt-2 w-full max-w-sm space-y-1.5">
          <Skeleton className="h-3 w-full bg-ivory/10" />
          <Skeleton className="h-3 w-3/4 bg-ivory/10" />
        </div>
        <Skeleton className="mt-6 h-9 w-44 bg-ivory/10" />
      </div>
    </div>
  );
}

/**
 * Centered brand loader used by layouts while initial session check
 * resolves. A 1px gold keyline sweeps left to right under the wordmark,
 * echoing the brand's hairline language.
 */
export function CenteredLoader({
  label = "Preparing Sanctuary",
}: {
  label?: string;
}) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 text-center">
      <div className="relative inline-block">
        <span className="block text-[11px] font-medium uppercase tracking-luxe text-stone">
          {label}
        </span>
        <span
          aria-hidden
          className="absolute -bottom-1.5 left-0 h-px w-8 bg-gold"
        />
      </div>
    </div>
  );
}
