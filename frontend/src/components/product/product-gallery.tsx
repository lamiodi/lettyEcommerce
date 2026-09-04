"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { LettyImage } from "@/components/shared/letty-image";
import { cn } from "@/lib/utils";
import { EASE_LUXURY } from "@/lib/motion";
import type { ProductMedia } from "@/types";

interface ProductGalleryProps {
  media: ProductMedia[];
  productName: string;
  badge?: string | null;
}

const slideVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? "100%" : direction < 0 ? "-100%" : 0,
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
  },
  exit: (direction: number) => ({
    x: direction > 0 ? "-100%" : direction < 0 ? "100%" : 0,
    opacity: 0,
  }),
};

/**
 * Mobile-first touch-enabled PDP gallery with silky horizontal slide transitions,
 * drag & swipe gestures, floating chevron navigation, and a synced thumbnail rail.
 */
export function ProductGallery({ media, productName, badge }: ProductGalleryProps) {
  const [[page, direction], setPage] = useState<[number, number]>([0, 0]);
  const thumbnailRefs = useRef<(HTMLButtonElement | null)[]>([]);

  // When media list changes (e.g. user selects a different variant), immediately reset to first slide!
  useEffect(() => {
    setPage([0, 0]);
  }, [media]);

  // Keep active index strictly within bounds of currently active media
  const activeIndex = Math.min(Math.max(0, page), Math.max(0, media.length - 1));
  const current = media[activeIndex] ?? media[0];

  const paginate = (newDirection: number) => {
    if (media.length <= 1) return;
    const nextIndex = (activeIndex + newDirection + media.length) % media.length;
    setPage([nextIndex, newDirection]);
  };

  const goToSlide = (targetIndex: number) => {
    if (targetIndex === activeIndex) return;
    const dir = targetIndex > activeIndex ? 1 : -1;
    setPage([targetIndex, dir]);
  };

  // Scroll active thumbnail into center view
  useEffect(() => {
    const activeThumb = thumbnailRefs.current[activeIndex];
    if (activeThumb) {
      activeThumb.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
        inline: "center",
      });
    }
  }, [activeIndex]);

  return (
    <div className="flex flex-col gap-3.5">
      {/* Main Slide Stage */}
      <div className="group relative aspect-[4/5] w-full overflow-hidden rounded-2xl bg-secondary select-none">
        <AnimatePresence initial={false} custom={direction}>
          {current && (
            <motion.div
              key={current.id || `${current.imageKey}-${activeIndex}`}
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              drag={media.length > 1 ? "x" : false}
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.25}
              onDragEnd={(_, { offset, velocity }) => {
                if (offset.x < -40 || velocity.x < -300) {
                  paginate(1);
                } else if (offset.x > 40 || velocity.x > 300) {
                  paginate(-1);
                }
              }}
              transition={{
                x: { type: "spring", stiffness: 320, damping: 32 },
                opacity: { duration: 0.22, ease: EASE_LUXURY },
              }}
              className={cn(
                "absolute inset-0 h-full w-full",
                media.length > 1 ? "cursor-grab active:cursor-grabbing" : "",
              )}
            >
              <LettyImage
                imageKey={current.imageKey}
                alt={current.alt || productName}
                sizes="(max-width: 1024px) 100vw, 50vw"
                priority
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Badge */}
        {badge && (
          <span className="absolute left-4 top-4 z-20 rounded-full bg-ivory/90 px-3 py-1.5 text-[0.65rem] font-semibold uppercase tracking-luxe-sm text-ink shadow-sm backdrop-blur-xs">
            {badge}
          </span>
        )}

        {/* Slide Counter Indicator & Dot Indicators */}
        {media.length > 1 && (
          <div className="pointer-events-none absolute right-4 bottom-4 z-20 flex items-center gap-2 rounded-full bg-ink/75 px-3 py-1.5 text-[11px] font-medium tracking-widest text-ivory shadow-sm backdrop-blur-md">
            <span>
              {activeIndex + 1} / {media.length}
            </span>
          </div>
        )}

        {/* Mobile Page Dots (Centered at bottom) */}
        {media.length > 1 && (
          <div className="pointer-events-none absolute left-1/2 bottom-4 z-20 flex -translate-x-1/2 items-center gap-1.5 rounded-full bg-ink/30 px-2.5 py-1 backdrop-blur-xs sm:hidden">
            {media.map((_, i) => (
              <span
                key={i}
                className={cn(
                  "h-1.5 rounded-full transition-all duration-300",
                  i === activeIndex ? "w-4 bg-ivory" : "w-1.5 bg-ivory/50",
                )}
              />
            ))}
          </div>
        )}

        {/* Floating Navigation Chevron Arrows */}
        {media.length > 1 && (
          <>
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                paginate(-1);
              }}
              aria-label="Previous image"
              className="absolute left-3 top-1/2 -translate-y-1/2 z-20 flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-full bg-ivory/90 text-ink shadow-md backdrop-blur-sm transition-all duration-200 hover:bg-ivory hover:scale-110 active:scale-95 cursor-pointer"
            >
              <ChevronLeft className="h-5 w-5 -ml-0.5" />
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                paginate(1);
              }}
              aria-label="Next image"
              className="absolute right-3 top-1/2 -translate-y-1/2 z-20 flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-full bg-ivory/90 text-ink shadow-md backdrop-blur-sm transition-all duration-200 hover:bg-ivory hover:scale-110 active:scale-95 cursor-pointer"
            >
              <ChevronRight className="h-5 w-5 -mr-0.5" />
            </button>
          </>
        )}
      </div>

      {/* Thumbnails Rail */}
      {media.length > 1 && (
        <div
          className="flex gap-2.5 overflow-x-auto pb-2 pt-1 scrollbar-none snap-x"
          role="tablist"
          aria-label="Product image thumbnails"
        >
          {media.map((m, i) => {
            const isSelected = i === activeIndex;
            return (
              <button
                key={m.id || `thumb-${i}`}
                ref={(el) => {
                  thumbnailRefs.current[i] = el;
                }}
                type="button"
                role="tab"
                aria-selected={isSelected}
                aria-label={`View image ${i + 1} of ${media.length}`}
                onClick={() => goToSlide(i)}
                className={cn(
                  "relative h-20 w-16 shrink-0 overflow-hidden rounded-xl bg-secondary snap-start cursor-pointer",
                  "transition-all duration-300 ease-out",
                  isSelected
                    ? "ring-2 ring-ink ring-offset-2 ring-offset-ivory opacity-100 scale-[1.02]"
                    : "opacity-60 hover:opacity-100",
                )}
              >
                <LettyImage imageKey={m.imageKey} alt={m.alt} sizes="64px" />
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
