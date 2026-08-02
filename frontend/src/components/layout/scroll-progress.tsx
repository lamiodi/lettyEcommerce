"use client";

import { motion, useScroll, useSpring } from "framer-motion";

/**
 * Hairline scroll-progress bar pinned to the top of the viewport.
 * Springs the raw scroll progress so the motion feels smooth, not linear.
 */
export function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 140,
    damping: 30,
    restDelta: 0.001,
  });

  return (
    <motion.div
      aria-hidden
      className="fixed inset-x-0 top-0 z-[60] h-[2px] origin-left bg-gold"
      style={{ scaleX }}
    />
  );
}
