import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { LettyImage } from "@/components/shared/letty-image";
import { LogoImage } from "@/components/shared/logo";
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
          "grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2",
          tiles.length >= 4 ? "lg:grid-cols-4" : "lg:grid-cols-3",
        )}
      >
        {tiles.map((tile, i) => {
          const isComingSoon = Boolean(tile.isComingSoon);
          const Wrapper = isComingSoon ? "div" : Link;
          const wrapperProps = isComingSoon
            ? { role: "region", "aria-label": `${tile.title} — ${tile.cta}` }
            : { href: tile.href, "aria-label": `${tile.title} — ${tile.cta}` };

          return (
            <Reveal key={tile.title} delay={0.08 * i} className={cn(i % 2 === 1 && "lg:mt-14")}>
              <Wrapper
                {...(wrapperProps as any)}
                className={cn(
                  "group relative block aspect-[3/4] overflow-hidden bg-ink shadow-sm transition-shadow duration-500 hover:shadow-xl",
                  !isComingSoon ? "cursor-pointer" : "cursor-default",
                )}
              >
                <LettyImage
                  imageKey={tile.imageKey}
                  alt={tile.title}
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  className="transition-transform duration-700 ease-out group-hover:scale-105"
                />
                <div
                  aria-hidden
                  className="absolute inset-0 bg-gradient-to-t from-ink/90 via-ink/35 to-ink/10 transition-opacity duration-500 group-hover:opacity-90"
                />

                {/* Letty Logo watermark behind the text for coming soon items */}
                {isComingSoon && (
                  <div
                    aria-hidden
                    className="pointer-events-none absolute inset-0 flex items-center justify-center overflow-hidden p-6"
                  >
                    <LogoImage
                      variant="dark"
                      className="h-44 w-auto opacity-40 drop-shadow-[0_4px_24px_rgba(0,0,0,0.8)] transition-all duration-700 ease-out group-hover:scale-110 group-hover:opacity-55 md:h-56"
                    />
                  </div>
                )}

                {/* Coming Soon top badge */}
                {isComingSoon && (
                  <div className="absolute right-4 top-4 z-10">
                    <span className="inline-block border border-gold/50 bg-ink/85 px-3 py-1 text-[10px] font-semibold uppercase tracking-luxe text-gold shadow-md backdrop-blur-md">
                      Coming Soon
                    </span>
                  </div>
                )}

                <div className="absolute inset-0 z-10 flex flex-col justify-end p-6 md:p-8">
                  <h3 className="font-serif text-2xl font-medium uppercase tracking-luxe-sm text-ivory drop-shadow-md transition-colors duration-300 group-hover:text-white md:text-3xl">
                    {tile.title}
                  </h3>
                  <span
                    className={cn(
                      "mt-1 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-luxe-sm transition-all duration-300",
                      isComingSoon
                        ? "text-gold drop-shadow-sm group-hover:text-gold/90"
                        : "text-ivory/85 group-hover:translate-x-1 group-hover:text-white",
                    )}
                  >
                    {tile.cta}
                    {!isComingSoon && (
                      <ArrowRight
                        className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-1"
                        aria-hidden
                      />
                    )}
                  </span>
                </div>
              </Wrapper>
            </Reveal>
          );
        })}
      </div>
    </section>
  );
}

