import Link from "next/link";
import { LettyImage } from "@/components/shared/letty-image";
import { Reveal } from "@/components/shared/reveal";
import { cn, formatPrice } from "@/lib/utils";
import { editorialCategories } from "@/lib/mock/content";
import type { EditorialCategory } from "@/lib/mock/content";

/**
 * Template Categories section — centered serif title above a staggered
 * four-column editorial grid. Odd columns lead with copy, even columns
 * lead with imagery and sit lower, mirroring the template masonry.
 *
 * Note: Despite the section name "editorial-services" in the codebase
 * (kept for file history), this UI displays product *categories* (Hair,
 * Fragrance, Skincare, Makeup), as defined in lib/mock/catalog.ts and the
 * blueprint schema.
 */
export function EditorialCategories() {
  return (
    <section aria-labelledby="categories-heading" className="bg-background">
      <div className="mx-auto max-w-7xl px-4 py-20 md:px-8 md:py-28">
        <Reveal className="text-center">
          <h2
            id="categories-heading"
            className="font-serif text-4xl font-medium text-ink md:text-5xl"
          >
            Categories
          </h2>
        </Reveal>

        <div className="mt-14 grid grid-cols-1 gap-x-5 gap-y-12 sm:grid-cols-2 lg:grid-cols-4">
          {editorialCategories.map((category, i) => {
            const imageFirst = i % 2 === 1;
            return (
              <Reveal
                key={category.title}
                delay={0.08 * i}
                className={cn(imageFirst && "lg:mt-14")}
              >
                <div className="flex h-full flex-col gap-6">
                  {imageFirst ? (
                    <>
                      <CategoryImage category={category} tall />
                      <CategoryCopy category={category} />
                    </>
                  ) : (
                    <>
                      <CategoryCopy category={category} />
                      <CategoryImage category={category} />
                    </>
                  )}
                </div>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function CategoryCopy({ category }: { category: EditorialCategory }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-2 text-center">
      <h3 className="font-serif text-2xl font-medium text-ink">
        {category.title}
      </h3>
      <p className="text-xs font-medium uppercase tracking-luxe-sm text-stone">
        From {formatPrice(category.fromPrice)}
      </p>
      <div className="w-full mt-3 flex flex-col items-center max-w-[200px] mx-auto">
        <hr className="w-full border-ink/30" />
        <Link
          href={category.href}
          className="w-full py-2.5 text-[11px] font-medium text-ink transition-colors hover:text-stone tracking-widest uppercase text-center"
        >
          Shop now
        </Link>
        <hr className="w-full border-ink/30" />
      </div>
    </div>
  );
}

function CategoryImage({
  category,
  tall = false,
}: {
  category: EditorialCategory;
  tall?: boolean;
}) {
  return (
    <Link
      href={category.href}
      aria-label={category.title}
      className={cn(
        "group relative block overflow-hidden bg-secondary",
        tall ? "aspect-[3/4]" : "aspect-[4/3]",
      )}
    >
      <LettyImage
        imageKey={category.imageKey}
        alt={category.title}
        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
        className="transition-transform duration-700 ease-out group-hover:scale-105"
      />
    </Link>
  );
}
