import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { LettyImage } from "@/components/shared/letty-image";
import { Reveal } from "@/components/shared/reveal";
import { cn } from "@/lib/utils";
import type { DepartmentTile } from "@/lib/data/departments";

interface DepartmentTilesProps {
  tiles: DepartmentTile[];
}

/**
 * Large editorial category tiles — Makeup / Body / Skincare, Dresses /
 * Sets / Tops / Bottoms, For Her / For Him / Unisex. Big imagery instead
 * of small product boxes; even tiles drop lower on desktop for the
 * staggered editorial rhythm used across the site.
 */
export function DepartmentTiles({ tiles }: DepartmentTilesProps) {
  return (
    <section
      aria-label="Shop by category"
      className="mx-auto max-w-7xl px-4 py-16 md:px-8 md:py-24"
    >
      <div
        className={cn(
          "grid grid-cols-1 gap-x-5 gap-y-10 sm:grid-cols-2",
          tiles.length >= 4 ? "lg:grid-cols-4" : "lg:grid-cols-3",
        )}
      >
        {tiles.map((tile, i) => (
          <Reveal key={tile.title} delay={0.08 * i} className={cn(i % 2 === 1 && "lg:mt-14")}>
            <Link
              href={tile.href}
              aria-label={`${tile.title} — ${tile.cta}`}
              className="group relative block aspect-[3/4] overflow-hidden bg-secondary"
            >
              <LettyImage
                imageKey={tile.imageKey}
                alt={tile.title}
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                className="transition-transform duration-700 ease-out group-hover:scale-105"
              />
              <div
                aria-hidden
                className="absolute inset-0 bg-gradient-to-t from-ink/70 via-ink/10 to-transparent"
              />
              <div className="absolute inset-x-0 bottom-0 flex flex-col items-start gap-1.5 p-6">
                <h3 className="font-serif text-2xl font-medium uppercase tracking-luxe-sm text-ivory">
                  {tile.title}
                </h3>
                <span className="inline-flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-luxe-sm text-ivory/85 transition-colors duration-300 group-hover:text-ivory">
                  {tile.cta}
                  <ArrowRight
                    className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-1"
                    aria-hidden
                  />
                </span>
              </div>
            </Link>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
