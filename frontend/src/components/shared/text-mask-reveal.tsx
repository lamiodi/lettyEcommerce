"use client";

import { motion } from "framer-motion";
import { DURATION, EASE_LUXURY } from "@/lib/motion";

interface TextMaskRevealProps {
  text: string;
  className?: string;
  /** Base delay before the first word rises (seconds). */
  delay?: number;
  /** Delay between consecutive words (seconds). */
  stagger?: number;
  once?: boolean;
}

/**
 * Editorial mask reveal — each word rises out of an overflow-hidden clip,
 * the signature luxury-brand headline treatment (Dior / Chanel style).
 * Splits by words (not lines) so responsive wrapping is never broken.
 *
 * The full string is exposed to assistive tech via aria-label; the animated
 * word spans are aria-hidden to avoid fragmented announcements.
 */
export function TextMaskReveal({
  text,
  className,
  delay = 0,
  stagger = 0.06,
  once = true,
}: TextMaskRevealProps) {
  const words = text.split(" ");

  return (
    <span className={className} aria-label={text}>
      {words.map((word, i) => (
        <span
          key={`${word}-${i}`}
          aria-hidden
          className="inline-block overflow-hidden align-bottom"
        >
          <motion.span
            className="inline-block will-change-transform"
            initial={{ y: "115%" }}
            whileInView={{ y: "0%" }}
            viewport={{ once, margin: "-60px" }}
            transition={{
              duration: DURATION.hero,
              ease: EASE_LUXURY,
              delay: delay + i * stagger,
            }}
          >
            {word}
            {i < words.length - 1 ? " " : ""}
          </motion.span>
        </span>
      ))}
    </span>
  );
}
