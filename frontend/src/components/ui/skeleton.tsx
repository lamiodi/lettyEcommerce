import { cn } from "@/lib/utils";

/**
 * Skeleton — base loading placeholder. Follows the LETTY luxury aesthetic:
 * strictly no rounded corners, hairline-thin keyline, and a slow "ink-on-ivory"
 * shimmer animation. Use className for sizing, `rounded-*` overrides are
 * explicitly disallowed.
 */
function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      aria-hidden
      className={cn(
        "relative overflow-hidden bg-ink/[0.06] dark:bg-ivory/[0.08]",
        "before:absolute before:inset-0",
        "before:-translate-x-full before:animate-[shimmer_2s_infinite]",
        "before:bg-gradient-to-r before:from-transparent before:via-ink/[0.08] before:to-transparent",
        "dark:before:via-ivory/[0.10]",
        className,
      )}
      {...props}
    />
  );
}

export { Skeleton };
