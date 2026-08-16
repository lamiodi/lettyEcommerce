import type { ImageKey } from "@/lib/images";
import type { Product } from "@/types";
import { getProducts } from "@/lib/data/products";

/**
 * Department ("world") configuration.
 *
 * Each department is a curated landing world — Makeup & Beauty, Fashion,
 * Fragrances, Eyewear — rendered through ONE shared template
 * (components/departments/department-page.tsx). The repetition of layout
 * is intentional: same visual language, different photography and mood.
 *
 * Section order follows the blueprint:
 * Campaign → Introduction → Collections/Categories → Featured Products
 * → Editorial Image → More Products.
 */

export interface DepartmentTile {
  title: string;
  cta: string;
  href: string;
  imageKey: ImageKey;
  isComingSoon?: boolean;
}

export interface RailFilter {
  isNew?: boolean;
  isBestSeller?: boolean;
  subcategorySlug?: string;
}

export type DepartmentSection =
  /** Horizontal product carousel — New & Noteworthy, Bestsellers,
   *  New Season, The Signatures. */
  | { kind: "rail"; title: string; filter: RailFilter; ctaHref?: string }
  /** Large editorial tiles linking into filtered shop views. */
  | { kind: "tiles"; tiles: DepartmentTile[] }
  /** Full-bleed parallax image with an optional quote — the visual pause. */
  | { kind: "editorial"; imageKey: ImageKey; quote?: string }
  /** Fragrance-only: each scent with campaign imagery + its mood line. */
  | { kind: "moods"; title: string }
  /** Fashion-only: a complete outfit with individually purchasable pieces. */
  | { kind: "look"; title: string; imageKey: ImageKey; productSlugs: string[] }
  /** Closing product grid + "view all" CTA. */
  | { kind: "grid"; title: string; ctaHref: string };

export interface Department {
  slug: string;
  name: string;
  tagline: string;
  ctaLabel: string;
  ctaHref: string;
  heroImageKey: ImageKey;
  /** Product pool for this world (spans multiple categories). */
  categorySlugs: string[];
  sections: DepartmentSection[];
}

export const DEPARTMENTS: Department[] = [
  {
    slug: "makeup-beauty",
    name: "Makeup & Beauty",
    tagline: "Elevate your everyday ritual.",
    ctaLabel: "Shop New Arrivals",
    ctaHref: "/shop?category=makeup&sort=newest",
    heroImageKey: "deptMakeupHero",
    categorySlugs: ["makeup", "body", "skincare"],
    sections: [
      {
        kind: "rail",
        title: "New & Noteworthy",
        filter: { isNew: true },
        ctaHref: "/shop?category=makeup&sort=newest",
      },
      {
        kind: "tiles",
        tiles: [
          { title: "Makeup", cta: "Explore Makeup", href: "/shop?category=makeup", imageKey: "tileMakeup" },
          { title: "Body", cta: "Explore Body Care", href: "/shop?category=body", imageKey: "tileBody" },
          { title: "Skincare", cta: "Coming Soon", href: "#", imageKey: "tileSkincare", isComingSoon: true },
        ],
      },
      {
        kind: "editorial",
        imageKey: "deptMakeupEditorial",
        quote: "Beauty is not a mask. It is the ritual of becoming yourself.",
      },
      {
        kind: "rail",
        title: "Bestsellers",
        filter: { isBestSeller: true },
        ctaHref: "/shop?category=makeup&sort=featured",
      },
      { kind: "grid", title: "The Beauty Edit", ctaHref: "/shop?category=makeup" },
    ],
  },
  {
    slug: "fashion",
    name: "Fashion",
    tagline: "An expression of modern elegance.",
    ctaLabel: "Discover the Collection",
    ctaHref: "/shop?category=fashion",
    heroImageKey: "deptFashionHero",
    categorySlugs: ["fashion"],
    sections: [
      {
        kind: "rail",
        title: "New Collection",
        filter: { isNew: true },
        ctaHref: "/shop?category=fashion&sort=newest",
      },
      {
        kind: "tiles",
        tiles: [
          { title: "Dresses", cta: "Explore Dresses", href: "/shop?category=fashion&sub=dresses", imageKey: "tileDresses" },
          { title: "Sets", cta: "Explore Sets", href: "/shop?category=fashion&sub=sets", imageKey: "tileSets" },
          { title: "Tops", cta: "Explore Tops", href: "/shop?category=fashion&sub=tops", imageKey: "tileTops" },
          { title: "Bottoms", cta: "Explore Bottoms", href: "/shop?category=fashion&sub=bottoms", imageKey: "tileBottoms" },
        ],
      },
      {
        kind: "look",
        title: "Shop the Look",
        imageKey: "lookAtelier",
        productSlugs: ["ivory-silk-slip-dress", "cashmere-wrap-cardigan", "leather-mini-tote"],
      },
      {
        kind: "editorial",
        imageKey: "deptFashionEditorial",
        quote: "Elegance is refusal — edited down to the essential.",
      },
      { kind: "grid", title: "The Collection", ctaHref: "/shop?category=fashion" },
    ],
  },
  {
    slug: "fragrances",
    name: "Fragrances",
    tagline: "Find your signature.",
    ctaLabel: "Discover",
    ctaHref: "/shop?category=fragrance",
    heroImageKey: "deptFragranceHero",
    categorySlugs: ["fragrance"],
    sections: [
      { kind: "moods", title: "The Collection" },
      {
        kind: "tiles",
        tiles: [
          { title: "For Her", cta: "Explore For Her", href: "/shop?category=fragrance&sub=for-her", imageKey: "tileForHer" },
          { title: "For Him", cta: "Explore For Him", href: "/shop?category=fragrance&sub=for-him", imageKey: "tileForHim" },
          { title: "Unisex", cta: "Explore Unisex", href: "/shop?category=fragrance&sub=unisex", imageKey: "tileUnisex" },
        ],
      },
      {
        kind: "editorial",
        imageKey: "deptFragranceEditorial",
        quote: "A scent is the memory you leave behind.",
      },
      { kind: "grid", title: "The Fragrance Wardrobe", ctaHref: "/shop?category=fragrance" },
    ],
  },
  {
    slug: "eyewear",
    name: "Eyewear",
    tagline: "Designed to be noticed.",
    ctaLabel: "Discover the Collection",
    ctaHref: "/shop?category=eyewear",
    heroImageKey: "deptEyewearHero",
    categorySlugs: ["eyewear"],
    sections: [
      {
        kind: "rail",
        title: "New Season",
        filter: { subcategorySlug: "new-season" },
        ctaHref: "/shop?category=eyewear&sub=new-season",
      },
      {
        kind: "editorial",
        imageKey: "deptEyewearEditorial",
        quote: "The right frame changes the face of everything.",
      },
      {
        kind: "rail",
        title: "The Signatures",
        filter: { subcategorySlug: "signatures" },
        ctaHref: "/shop?category=eyewear&sub=signatures",
      },
      { kind: "grid", title: "All Eyewear", ctaHref: "/shop?category=eyewear" },
    ],
  },
];

export async function getDepartment(slug: string): Promise<Department | null> {
  return DEPARTMENTS.find((d) => d.slug === slug) ?? null;
}

/** Products belonging to a department world, sorted featured-first. */
export async function getDepartmentProducts(department: Department): Promise<Product[]> {
  const all = await getProducts({ sort: "featured" });
  return all.filter((p) => department.categorySlugs.includes(p.categorySlug));
}

/** Apply a rail's filter to the department's product pool. */
export function filterRailProducts(pool: Product[], filter: RailFilter): Product[] {
  let out = pool;
  if (filter.subcategorySlug) {
    out = out.filter((p) => p.subcategorySlug === filter.subcategorySlug);
  }
  if (filter.isNew) {
    out = out.filter((p) => p.isNew);
  }
  if (filter.isBestSeller) {
    out = out.filter((p) => p.isBestSeller);
  }
  return out;
}
