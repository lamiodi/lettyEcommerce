"use client";

import { useEffect, useState } from "react";
import { motion, useScroll, useSpring } from "framer-motion";

/**
 * Hairline scroll-progress bar pinned to the top of the viewport.
 * Active on desktop only (hidden/unmounted on mobile to protect touch scroll frame budget).
 */
export function ScrollProgress() {
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setIsDesktop(window.matchMedia("(min-width: 768px)").matches);
    }
  }, []);

  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 140,
    damping: 30,
    restDelta: 0.001,
  });

  if (!isDesktop) return null;

  return (
    <motion.div
      aria-hidden
      className="fixed inset-x-0 top-0 z-[60] h-[2px] origin-left bg-gold hidden md:block"
      style={{ scaleX }}
    />
  );
}
