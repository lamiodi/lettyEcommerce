"use client";

import {
  motion,
  useMotionValue,
  useReducedMotion,
  useSpring,
} from "framer-motion";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

/**
 * Subtle cursor accent — a small gold dot that tracks the pointer instantly
 * and a trailing gold ring that expands over interactive elements. The native
 * cursor stays visible (usability first on a store); this is purely an accent.
 *
 * Uses the brand gold (#a98a5f) so it reads as part of the theme over both
 * ivory sections and dark editorial imagery. Desktop only (pointer: fine),
 * disabled on checkout/cart and for reduced-motion users.
 */
export function Cursor() {
  const pathname = usePathname();
  const reduceMotion = useReducedMotion();
  const [enabled, setEnabled] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [visible, setVisible] = useState(false);

  const x = useMotionValue(-100);
  const y = useMotionValue(-100);
  const ringX = useSpring(x, { stiffness: 350, damping: 35, mass: 0.6 });
  const ringY = useSpring(y, { stiffness: 350, damping: 35, mass: 0.6 });

  const disabled =
    pathname.startsWith("/checkout") || pathname.startsWith("/cart");

  useEffect(() => {
    if (disabled || reduceMotion) return;
    if (!window.matchMedia("(pointer: fine)").matches) return;

    setEnabled(true);

    const onMove = (e: MouseEvent) => {
      x.set(e.clientX);
      y.set(e.clientY);
      setVisible(true);
    };
    const onOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      setHovered(
        !!target?.closest(
          "a, button, [role='button'], input, select, textarea, label, summary",
        ),
      );
    };
    const onLeave = () => setVisible(false);

    window.addEventListener("mousemove", onMove, { passive: true });
    window.addEventListener("mouseover", onOver, { passive: true });
    document.documentElement.addEventListener("mouseleave", onLeave);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseover", onOver);
      document.documentElement.removeEventListener("mouseleave", onLeave);
    };
  }, [disabled, reduceMotion, x, y]);

  if (!enabled) return null;

  return (
    <>
      {/* Trailing ring — expands and fills over interactive elements */}
      <motion.div
        aria-hidden
        className="pointer-events-none fixed left-0 top-0 z-[100]"
        style={{ x: ringX, y: ringY }}
      >
        <div
          className={cn(
            "-translate-x-1/2 -translate-y-1/2 rounded-full border border-gold/70",
            "transition-all duration-300 ease-out",
            hovered ? "h-11 w-11 bg-gold/15" : "h-7 w-7",
            visible ? "opacity-100" : "opacity-0",
          )}
        />
      </motion.div>
      {/* Center dot — instant tracking, fades into the ring on hover */}
      <motion.div
        aria-hidden
        className="pointer-events-none fixed left-0 top-0 z-[100]"
        style={{ x, y }}
      >
        <div
          className={cn(
            "-translate-x-1/2 -translate-y-1/2 rounded-full bg-gold",
            "transition-all duration-300 ease-out",
            hovered ? "h-1 w-1" : "h-1.5 w-1.5",
            visible ? "opacity-100" : "opacity-0",
          )}
        />
      </motion.div>
    </>
  );
}
