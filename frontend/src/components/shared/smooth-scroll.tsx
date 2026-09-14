"use client";

import { usePathname } from "next/navigation";
import { useEffect, type ReactNode } from "react";

/**
 * Smooth inertial scrolling (Lenis). Framer Motion's useScroll keeps working
 * because Lenis drives the native window scroll position.
 *
 * Disabled where smooth scroll would hurt trust or usability:
 *  - checkout & cart flows (native scroll feels more reliable)
 *  - users with prefers-reduced-motion
 *  - mobile touchscreens (pointer: coarse) — dynamic import prevents bundling on mobile
 */
export function SmoothScroll({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const disabled =
    pathname.startsWith("/checkout") || pathname.startsWith("/cart");

  useEffect(() => {
    if (disabled) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (window.matchMedia("(pointer: coarse)").matches) return;

    let lenisInstance: InstanceType<typeof import("lenis").default> | null = null;
    let rafId: number | null = null;
    let isCancelled = false;

    import("lenis").then(({ default: Lenis }) => {
      if (isCancelled) return;

      lenisInstance = new Lenis({
        duration: 1.1,
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        smoothWheel: true,
      });

      const loop = (time: number) => {
        lenisInstance?.raf(time);
        rafId = requestAnimationFrame(loop);
      };
      rafId = requestAnimationFrame(loop);
    });

    return () => {
      isCancelled = true;
      if (rafId !== null) cancelAnimationFrame(rafId);
      lenisInstance?.destroy();
    };
  }, [disabled]);

  return <>{children}</>;
}
