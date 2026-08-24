"use client";

import { useState } from "react";
import { Star, X, Check } from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { LinedButton } from "@/components/shared/lined-button";
import { cn } from "@/lib/utils";

interface ReviewDialogProps {
  isOpen: boolean;
  onClose: () => void;
  productName: string;
  productSlug: string;
}

export function ReviewDialog({
  isOpen,
  onClose,
  productName,
  productSlug,
}: ReviewDialogProps) {
  const [selectedRating, setSelectedRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [author, setAuthor] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!body.trim()) {
      toast.error("Please provide your review thoughts.");
      return;
    }

    setSubmitted(true);
    toast.success("Thank you for sharing your ritual review.");
    setTimeout(() => {
      setSubmitted(false);
      setTitle("");
      setBody("");
      setAuthor("");
      onClose();
    }, 1200);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            aria-hidden
            className="fixed inset-0 bg-ink/60 backdrop-blur-sm"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 16 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="relative z-10 w-full max-w-lg overflow-hidden rounded-none border border-line bg-ivory p-6 sm:p-8 shadow-2xl"
          >
            <button
              type="button"
              onClick={onClose}
              aria-label="Close review dialog"
              className="absolute right-4 top-4 text-stone transition-colors hover:text-ink"
            >
              <X className="h-5 w-5" />
            </button>

            {submitted ? (
              <div className="flex flex-col items-center py-10 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gold/20 text-gold">
                  <Check className="h-6 w-6" />
                </div>
                <h3 className="mt-4 font-serif text-2xl font-medium text-ink">
                  Review Submitted
                </h3>
                <p className="mt-2 text-sm text-stone">
                  Your feedback for {productName} has been received and will appear shortly.
                </p>
              </div>
            ) : (
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-stone">
                  Client Reflections
                </p>
                <h2 className="mt-1 font-serif text-2xl font-medium text-ink sm:text-3xl">
                  Review Your Ritual
                </h2>
                <p className="mt-1 text-sm text-stone">
                  {productName}
                </p>

                <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
                  <div>
                    <label className="block text-xs font-medium uppercase tracking-luxe text-stone mb-2">
                      Overall Rating
                    </label>
                    <div className="flex items-center gap-1.5" role="radiogroup" aria-label="Select rating">
                      {[1, 2, 3, 4, 5].map((star) => {
                        const active = (hoverRating ?? selectedRating) >= star;
                        return (
                          <button
                            key={star}
                            type="button"
                            onClick={() => setSelectedRating(star)}
                            onMouseEnter={() => setHoverRating(star)}
                            onMouseLeave={() => setHoverRating(null)}
                            className="p-1 transition-transform hover:scale-110 focus:outline-none"
                            aria-label={`${star} star${star > 1 ? "s" : ""}`}
                          >
                            <Star
                              className={cn(
                                "h-6 w-6 transition-colors duration-200",
                                active ? "fill-gold text-gold" : "fill-line text-line"
                              )}
                            />
                          </button>
                        );
                      })}
                      <span className="ml-2 text-xs font-medium text-stone">
                        {hoverRating ?? selectedRating} / 5
                      </span>
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="review-author"
                      className="block text-xs font-medium uppercase tracking-luxe text-stone"
                    >
                      Your Name
                    </label>
                    <input
                      id="review-author"
                      type="text"
                      required
                      value={author}
                      onChange={(e) => setAuthor(e.target.value)}
                      placeholder="e.g. Amara M."
                      className="mt-1.5 w-full border-b border-line bg-transparent py-2 text-sm text-ink outline-none placeholder:text-stone/50 focus:border-ink"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="review-title"
                      className="block text-xs font-medium uppercase tracking-luxe text-stone"
                    >
                      Headline
                    </label>
                    <input
                      id="review-title"
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="e.g. Pure luxury, transformative texture"
                      className="mt-1.5 w-full border-b border-line bg-transparent py-2 text-sm text-ink outline-none placeholder:text-stone/50 focus:border-ink"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="review-body"
                      className="block text-xs font-medium uppercase tracking-luxe text-stone"
                    >
                      Your Review
                    </label>
                    <textarea
                      id="review-body"
                      required
                      rows={3}
                      value={body}
                      onChange={(e) => setBody(e.target.value)}
                      placeholder="Describe your experience, texture, scent, and wear..."
                      className="mt-1.5 w-full border border-line bg-transparent p-3 text-sm text-ink outline-none placeholder:text-stone/50 focus:border-ink"
                    />
                  </div>

                  <div className="mt-4 flex justify-end">
                    <LinedButton type="submit" tone="ink" width="w-full sm:w-[220px]">
                      Submit Review
                    </LinedButton>
                  </div>
                </form>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
