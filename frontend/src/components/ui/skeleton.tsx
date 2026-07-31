import { cn } from "@/lib/utils";

/**
 * Skeleton — base loading placeholder. Follows the LETTY luxury aesthetic:
 * strictly no rounded corners, hairline-thin tonal keyline, and a slow
 * "ink-on-ivory" shimmer animation. Uses the brand tokens (--ink, --ivory)
 * so it tracks the active theme automatically.
 *
 * Use className for sizing. `rounded-*` overrides are disallowed by
 * the brand design rules.
 */
function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      aria-hidden
      className={cn(
        // Tonal keyline, hairline-thin, fully flush corners
        "relative overflow-hidden bg-ink/[0.05] dark:bg-ivory/[0.07]",
        // Subtle two-tone wash so the placeholders feel like a
        // neutral surface, not a flat gray
        "bg-gradient-to-r from-ink/[0.04] via-ink/[0.06] to-ink/[0.04]",
        "dark:from-ivory/[0.05] dark:via-ivory/[0.08] dark:to-ivory/[0.05]",
        // Slow horizontal shimmer (2s cadence matches the brand tempo)
        "before:absolute before:inset-0",
        "before:-translate-x-full before:animate-[shimmer_2.2s_infinite]",
        "before:bg-gradient-to-r",
        "before:from-transparent before:via-ivory/40 before:to-transparent",
        "dark:before:via-ink/15",
        className,
      )}
      {...props}
    />
  );
}

export { Skeleton };
