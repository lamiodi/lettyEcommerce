"use client";

import { useState } from "react";
import { LettyImage } from "@/components/shared/letty-image";
import { cn } from "@/lib/utils";
import type { ProductMedia } from "@/types";

interface ProductGalleryProps {
  media: ProductMedia[];
  productName: string;
  badge?: string | null;
}

/** PDP gallery — large stage with a thumbnail rail below. */
export function ProductGallery({ media, productName, badge }: ProductGalleryProps) {
  const [active, setActive] = useState(0);
  const current = media[active] ?? media[0];

  return (
    <div className="flex flex-col gap-3">
      <div className="relative aspect-[4/5] overflow-hidden rounded-xl bg-secondary">
        {current && (
          <LettyImage
            key={current.id}
            imageKey={current.imageKey}
            alt={current.alt || productName}
            sizes="(max-width: 1024px) 100vw, 50vw"
            priority
          />
        )}
        {badge && (
          <span className="absolute left-4 top-4 rounded-full bg-ivory/90 px-3 py-1.5 text-[0.65rem] font-medium uppercase tracking-luxe-sm text-ink">
            {badge}
          </span>
        )}
      </div>

      {media.length > 1 && (
        <div className="flex gap-3" role="tablist" aria-label="Product images">
          {media.map((m, i) => (
            <button
              key={m.id}
              type="button"
              role="tab"
              aria-selected={i === active}
              aria-label={`View image ${i + 1} of ${media.length}`}
              onClick={() => setActive(i)}
              className={cn(
                "relative h-20 w-16 overflow-hidden rounded-lg bg-secondary transition",
                i === active
                  ? "ring-2 ring-ink ring-offset-2 ring-offset-ivory"
                  : "opacity-70 hover:opacity-100",
              )}
            >
              <LettyImage imageKey={m.imageKey} alt={m.alt} sizes="64px" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
