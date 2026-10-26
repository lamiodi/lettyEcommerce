"use client";

import { useEffect, useState } from "react";
import { Eye } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Social-proof viewer pill — marketing copy, not analytics. Shows a stable
 * 5–7 count per product per visit so a lone shopper never sees "1 person".
 */
export function ProductInterest({ slug, className }: { slug: string; className?: string }) {
  const [count, setCount] = useState<number>(6);

  useEffect(() => {
    // Initial seeded random between 5 and 9
    const initial = 5 + Math.floor(Math.random() * 5);
    setCount(initial);

    // Live organic fluctuation every 7-12 seconds
    let current = initial;
    const interval = setInterval(() => {
      // Random delta of -1, 0, or +1, occasionally +2 or -2
      const deltas = [-1, 1, -1, 1, 0, 2, -2];
      const delta = deltas[Math.floor(Math.random() * deltas.length)];
      current = Math.min(14, Math.max(4, current + delta));
      setCount(current);
    }, 7000 + Math.random() * 5000);

    return () => clearInterval(interval);
  }, [slug]);

  return (
    <div className={cn("mb-4 min-h-8", className)}>
      <p role="status" className="inline-flex max-w-full items-center gap-2 rounded-full border border-gold/20 bg-surface/70 px-3 py-1.5 text-[10px] leading-relaxed text-stone sm:text-[11px] transition-all duration-300">
        <Eye className="h-3.5 w-3.5 shrink-0 text-ink/70" strokeWidth={1.4} aria-hidden />
        <span>
          <span className="font-semibold tabular-nums text-ink transition-all duration-300">{count}</span> people are checking this out right now
        </span>
        <span aria-hidden className="relative flex h-2 w-2 shrink-0">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-600" />
        </span>
      </p>
    </div>
  );
}

