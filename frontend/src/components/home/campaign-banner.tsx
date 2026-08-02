"use client";

import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import { LettyImage } from "@/components/shared/letty-image";

/**
 * Template campaign band — a pure full-width editorial image with no
 * overlay copy, acting as a visual pause between Services and Cosmetics.
 *
 * Motion: subtle parallax effect on scroll — the image moves at a
 * slightly slower rate than the viewport, giving a sense of depth.
 * Uses GPU-composited translateY only.
 */
export function CampaignBanner() {
  const ref = useRef<HTMLElement>(null);
  const reduceMotion = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });

  const y = useTransform(scrollYProgress, [0, 1], ["-4%", "4%"]);

  return (
    <section
      ref={ref}
      aria-label="LETTY editorial campaign"
      className="relative overflow-hidden"
    >
      <div className="relative h-[50vh] min-h-[360px] w-full md:h-[65vh]">
        <motion.div
          className="absolute inset-[-8%] will-change-transform"
          style={{ y: reduceMotion ? 0 : y }}
        >
          <LettyImage
            imageKey="campaignBanner"
            sizes="100vw"
            className="object-center"
          />
        </motion.div>
      </div>
    </section>
  );
}
