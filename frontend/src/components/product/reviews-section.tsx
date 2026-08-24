"use client";

import { useState } from "react";
import { BadgeCheck, PenSquare } from "lucide-react";
import { RatingStars } from "@/components/shared/rating-stars";
import { ReviewDialog } from "@/components/product/review-dialog";
import { LinedButton } from "@/components/shared/lined-button";
import { SectionHeading } from "@/components/shared/section-heading";
import type { Review } from "@/types";

interface ReviewsSectionProps {
  reviews: Review[];
  rating: number;
  reviewCount: number;
  productName?: string;
  productSlug?: string;
}

/** PDP reviews — summary panel plus individual review cards and review writing. */
export function ReviewsSection({
  reviews,
  rating,
  reviewCount,
  productName = "Product",
  productSlug = "",
}: ReviewsSectionProps) {
  const [reviewOpen, setReviewOpen] = useState(false);

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
              <RatingStars
                rating={rating}
                showCount={false}
                size="md"
                onClick={() => setReviewOpen(true)}
              />
            </div>
            <p className="mt-3 text-sm text-stone">
              Based on {reviewCount} verified reviews
            </p>

            <div className="mt-6 flex justify-center">
              <button
                type="button"
                onClick={() => setReviewOpen(true)}
                className="inline-flex items-center gap-2 text-xs font-medium uppercase tracking-luxe text-ink transition-colors hover:text-stone"
              >
                <PenSquare className="h-3.5 w-3.5" />
                Write a Review
              </button>
            </div>
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

      <ReviewDialog
        isOpen={reviewOpen}
        onClose={() => setReviewOpen(false)}
        productName={productName}
        productSlug={productSlug}
      />
    </section>
  );
}
