"use client";

import { motion, type Variants } from "framer-motion";
import type { ReactNode } from "react";

const variants: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: (delay: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, delay, ease: [0.22, 1, 0.36, 1] },
  }),
};

interface RevealProps {
  children: ReactNode;
  delay?: number;
  className?: string;
  once?: boolean;
}

/** Subtle fade-and-rise reveal when content scrolls into view. */
export function Reveal({ children, delay = 0, className, once = true }: RevealProps) {
  return (
    <motion.div
      className={className}
      variants={variants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once, margin: "-80px" }}
      custom={delay}
    >
      {children}
    </motion.div>
  );
}
