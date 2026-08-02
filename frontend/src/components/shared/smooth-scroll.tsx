"use client";

import Lenis from "lenis";
import { usePathname } from "next/navigation";
import { useEffect, type ReactNode } from "react";

/**
 * Smooth inertial scrolling (Lenis). Framer Motion's useScroll keeps working
 * because Lenis drives the native window scroll position.
 *
 * Disabled where smooth scroll would hurt trust or usability:
 *  - checkout & cart flows (native scroll feels more reliable)
 *  - users with prefers-reduced-motion
 */
export function SmoothScroll({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const disabled =
    pathname.startsWith("/checkout") || pathname.startsWith("/cart");

  useEffect(() => {
    if (disabled) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const lenis = new Lenis({
      duration: 1.1,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
    });

    let rafId: number;
    const loop = (time: number) => {
      lenis.raf(time);
      rafId = requestAnimationFrame(loop);
    };
    rafId = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(rafId);
      lenis.destroy();
    };
  }, [disabled]);

  return <>{children}</>;
}
