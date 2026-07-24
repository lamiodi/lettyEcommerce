import { BadgeCheck } from "lucide-react";
import { RatingStars } from "@/components/shared/rating-stars";
import { SectionHeading } from "@/components/shared/section-heading";
import type { Review } from "@/types";

interface ReviewsSectionProps {
  reviews: Review[];
  rating: number;
  reviewCount: number;
}

/** PDP reviews — summary panel plus individual review cards. */
export function ReviewsSection({ reviews, rating, reviewCount }: ReviewsSectionProps) {
  return (
    <section aria-labelledby="reviews-heading" className="mt-20 border-t border-line pt-16">
      <SectionHeading eyebrow="Reviews" title="What our clients say" />
      <span id="reviews-heading" className="sr-only">
        Customer reviews
      </span>

      <div className="mt-10 grid grid-cols-1 gap-10 lg:grid-cols-12">
        <div className="lg:col-span-4">
          <div className="rounded-xl bg-secondary/60 p-8 text-center">
            <p className="font-serif text-5xl font-medium text-ink">{rating.toFixed(1)}</p>
            <div className="mt-3 flex justify-center">
              <RatingStars rating={rating} showCount={false} size="md" />
            </div>
            <p className="mt-3 text-sm text-stone">
              Based on {reviewCount} verified reviews
            </p>
          </div>
        </div>

        <ul className="flex flex-col gap-6 lg:col-span-8">
          {reviews.map((review) => (
            <li key={review.id} className="rounded-xl border border-line bg-card p-6">
              <div className="flex items-center justify-between gap-4">
                <RatingStars rating={review.rating} showCount={false} />
                <time className="text-xs text-stone" dateTime={review.date}>
                  {new Date(review.date).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </time>
              </div>
              <h3 className="mt-3 text-sm font-medium text-ink">{review.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-stone">{review.body}</p>
              <p className="mt-4 flex items-center gap-2 text-xs text-stone">
                <span className="font-medium text-ink">{review.author}</span>
                {review.verified && (
                  <span className="inline-flex items-center gap-1 text-gold">
                    <BadgeCheck className="h-3.5 w-3.5" aria-hidden />
                    Verified purchase
                  </span>
                )}
              </p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
