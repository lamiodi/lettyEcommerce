"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Tracks a horizontal scroll track as Dior-style "current / total" pages
 * and exposes arrow-driven page scrolling. Shared by the homepage and
 * department product carousels so pagination behaves identically everywhere.
 */
export function usePagedTrack() {
  const trackRef = useRef<HTMLDivElement>(null);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);

  const update = useCallback(() => {
    const el = trackRef.current;
    if (!el) return;
    const pageWidth = el.clientWidth || 1;
    const total = Math.max(1, Math.ceil(el.scrollWidth / pageWidth));
    setPages(total);
    setPage(Math.min(total, Math.round(el.scrollLeft / pageWidth) + 1));
  }, []);

  useEffect(() => {
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, [update]);

  const scrollByPage = useCallback((direction: 1 | -1) => {
    const el = trackRef.current;
    if (!el) return;
    el.scrollBy({ left: direction * el.clientWidth, behavior: "smooth" });
  }, []);

  return { trackRef, page, pages, onScroll: update, scrollByPage };
}
