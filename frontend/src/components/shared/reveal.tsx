"use client";

import { motion, type Variants } from "framer-motion";
import type { ReactNode } from "react";
import { revealVariants } from "@/lib/motion";

interface RevealProps {
  children: ReactNode;
  delay?: number;
  className?: string;
  once?: boolean;
  /** Viewport intersection margin — how far before the element enters
   *  the viewport the animation fires. Negative values trigger early. */
  margin?: string;
}

/**
 * Subtle fade-and-rise reveal when content scrolls into view.
 * Draws from the centralized motion system for consistency.
 *
 * Uses GPU-friendly transforms only (opacity + translateY).
 * Respects prefers-reduced-motion via Framer Motion's built-in support.
 */
export function Reveal({
  children,
  delay = 0,
  className,
  once = true,
  margin = "-80px",
}: RevealProps) {
  return (
    <motion.div
      className={className}
      variants={revealVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once, margin }}
      custom={delay}
    >
      {children}
    </motion.div>
  );
}
