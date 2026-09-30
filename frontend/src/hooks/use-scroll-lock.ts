"use client";

import { useEffect } from "react";

/**
 * Freeze page scrolling while a fixed overlay (popup modal) is open.
 * Hides body overflow for native scroll and pauses Lenis so wheel events
 * over the overlay can't smooth-scroll the page behind the backdrop.
 */
export function useScrollLock(active: boolean) {
  useEffect(() => {
    if (!active) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.__lenis?.stop();
    return () => {
      document.body.style.overflow = prev;
      window.__lenis?.start();
    };
  }, [active]);
}
