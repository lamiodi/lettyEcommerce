import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface RatingStarsProps {
  rating: number;
  count?: number;
  size?: "sm" | "md";
  className?: string;
  showCount?: boolean;
  onClick?: () => void;
  interactive?: boolean;
}

/** Five-star display with fractional fill via an overlay row and optional tap-to-review. */
export function RatingStars({
  rating,
  count,
  size = "sm",
  className,
  showCount = true,
  onClick,
  interactive = false,
}: RatingStarsProps) {
  const px = size === "sm" ? "h-3.5 w-3.5" : "h-4 w-4";
  const percent = Math.min(100, Math.max(0, (rating / 5) * 100));

  const content = (
    <>
      <span className="relative inline-flex" aria-label={`Rated ${rating} out of 5`}>
        <span className="flex gap-0.5 text-line">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star key={i} className={cn(px, "fill-current")} strokeWidth={0} />
          ))}
        </span>
        <span
          aria-hidden
          className="absolute inset-0 flex gap-0.5 overflow-hidden text-gold"
          style={{ width: `${percent}%` }}
        >
          {Array.from({ length: 5 }).map((_, i) => (
            <Star key={i} className={cn(px, "shrink-0 fill-current")} strokeWidth={0} />
          ))}
        </span>
      </span>
      {showCount && count != null && (
        <span className="text-xs text-stone transition-colors group-hover/stars:text-ink">
          ({count})
        </span>
      )}
    </>
  );

  if (onClick || interactive) {
    return (
      <button
        type="button"
        onClick={onClick}
        title="Tap to leave a review"
        aria-label="Tap to rate or leave a review"
        className={cn(
          "group/stars inline-flex items-center gap-1.5 cursor-pointer transition-transform hover:scale-105 active:scale-95 focus:outline-none",
          className
        )}
      >
        {content}
      </button>
    );
  }

  return (
    <span className={cn("inline-flex items-center gap-1.5", className)}>
      {content}
    </span>
  );
}
