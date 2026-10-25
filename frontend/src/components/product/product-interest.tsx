"use client";

import { useEffect, useState } from "react";
import { Eye } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Social-proof viewer pill — marketing copy, not analytics. Shows a stable
 * 5–7 count per product per visit so a lone shopper never sees "1 person".
 */
export function ProductInterest({ slug, className }: { slug: string; className?: string }) {
  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    try {
      const key = `letty-interest-${slug}`;
      let stored = sessionStorage.getItem(key);
      if (stored == null) {
        stored = String(5 + Math.floor(Math.random() * 3));
        sessionStorage.setItem(key, stored);
      }
      const parsed = Number(stored);
      setCount(Number.isInteger(parsed) && parsed >= 5 && parsed <= 7 ? parsed : 6);
    } catch {
      setCount(6);
    }
  }, [slug]);

  return (
    <div className={cn("mb-4 min-h-8", className)}>
      {count !== null && (
        <p role="status" className="inline-flex max-w-full items-center gap-2 rounded-full border border-gold/20 bg-surface/70 px-3 py-1.5 text-[10px] leading-relaxed text-stone sm:text-[11px]">
          <Eye className="h-3.5 w-3.5 shrink-0 text-ink/70" strokeWidth={1.4} aria-hidden />
          <span><span className="font-medium tabular-nums text-ink">{count}</span> people are checking this out right now</span>
          <span aria-hidden className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#76836a]" />
        </p>
      )}
    </div>
  );
}
