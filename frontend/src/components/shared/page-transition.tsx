"use client";

import { motion } from "framer-motion";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { pageTransition } from "@/lib/motion";

interface PageTransitionProps {
  children: ReactNode;
}

/**
 * Lightweight page-level fade transition. Wraps the main content area
 * and triggers a sub-300ms opacity transition on route changes.
 *
 * Performance note: only animates `opacity` (GPU-composited) — no
 * layout thrashing, no CLS impact.
 */
export function PageTransition({ children }: PageTransitionProps) {
  const pathname = usePathname();

  return (
    <motion.div
      key={pathname}
      variants={pageTransition}
      initial="initial"
      animate="enter"
      className="will-change-[opacity]"
    >
      {children}
    </motion.div>
  );
}
