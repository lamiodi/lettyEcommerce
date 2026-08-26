"use client";

import { motion } from "framer-motion";
import { staggerChild, staggerContainer, EASE_LUXURY } from "@/lib/motion";

interface TrustBarProps {
  items?: string[];
}

const DEFAULT_ITEMS = [
  "✓ Secure Checkout",
  "✓ Complimentary Returns",
  "✓ Authentic Formulations & Pieces",
  "✓ Worldwide Express Shipping",
];

/**
 * Trust badge bar — renders just below the hero. Uses a stagger
 * container to elegantly reveal each badge in sequence as the
 * section enters the viewport.
 */
export function TrustBar({ items = DEFAULT_ITEMS }: TrustBarProps) {
  return (
    <div className="bg-ivory border-b border-line py-4">
      <motion.div
        className="mx-auto max-w-7xl flex flex-wrap justify-center gap-6 px-4 text-[10px] font-medium uppercase tracking-luxe text-stone md:gap-12 md:text-[11px]"
        variants={staggerContainer}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-40px" }}
      >
        {items.map((item) => (
          <motion.span key={item} variants={staggerChild}>
            {item}
          </motion.span>
        ))}
      </motion.div>
    </div>
  );
}
