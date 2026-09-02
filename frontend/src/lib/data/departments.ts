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
  isFavourite?: boolean;
  subcategorySlug?: string;
}

export interface RailTab {
  label: string;
  filter: RailFilter;
  ctaHref?: string;
}

export type DepartmentSection =
  /** Horizontal product carousel — New, Bestseller, Letty’s Favourite tabs or custom single filter. */
  | { kind: "rail"; title: string; filter?: RailFilter; ctaHref?: string; tabs?: RailTab[] }
  /** Large editorial tiles linking into filtered shop views. */
  | { kind: "tiles"; tiles: DepartmentTile[] }
  /** Full-bleed parallax image with an optional quote — the visual pause. */
  | { kind: "editorial"; imageKey: ImageKey; quote?: string }
  /** Fragrance-only: each scent with campaign imagery + its mood line. */
  | { kind: "moods"; title: string }
  /** Fashion-only: a complete outfit with individually purchasable pieces. */
  | { kind: "look"; title: string; imageKey: ImageKey; productSlugs: string[] }
  /** Closing product grid + "view all" CTA. */
  | {
      kind: "grid";
      title: string;
      subtitle?: string;
      ctaHref: string;
      ctaLabel?: string;
      limit?: number;
      hideBestSellerBadge?: boolean;
    }
  /** Makeup & Beauty: customer-tagged video wall, sourced from the
   *  maison's social channels and moderated to a luxe tone. */
  | {
      kind: "ugc";
      title?: string;
      eyebrow?: string;
      description?: string;
      hashtag?: string;
      /** Optional list of videos; first one is featured first. */
      videos?: Array<{ src: string; poster?: string; handle: string; caption: string; location?: string }>;
    };

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
    tagline: "ELEVATE YOUR\nEVERYDAY RITUAL.",
    ctaLabel: "SHOP NEW ARRIVALS",
    ctaHref: "/shop?category=makeup&sort=newest",
    heroImageKey: "deptMakeupHero",
    categorySlugs: ["makeup", "body", "skincare"],
    sections: [
      {
        kind: "rail",
        title: "New",
        tabs: [
          { label: "New", filter: { isNew: true }, ctaHref: "/shop?category=makeup&sort=newest" },
          { label: "Bestseller", filter: { isBestSeller: true }, ctaHref: "/shop?category=makeup&sort=featured" },
          { label: "Letty’s Favourite", filter: { isFavourite: true }, ctaHref: "/collections/the-edit" },
        ],
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
      },
      {
        kind: "ugc",
        title: "Inside the Ritual",
        eyebrow: "Tagged by you",
        description:
          "The LETTY look, captured in real life. Tag @lettybeautyofficial on Instagram or TikTok to be considered for our Beauty Edit.",
        hashtag: "#lettybeautyofficial",
        videos: [
          {
            src: "/IMG_6572.MOV",
            handle: "@_simaipek",
            caption: "Terra Lip Liner",
            location: "London",
          },
          {
            src: "/IMG_5725.MOV",
            handle: "@elena.r",
            caption: "Soft bronze for the evening",
            location: "Paris",
          },
          {
            src: "/IMG_6577.MOV",
            handle: "@yuyuan.10",
            caption: "Velvet Nude Lip Gloss",
            location: "China",
          },
          {
            src: "/IMG_9502.MOV",
            handle: "@hadel",
            caption: "Cocoa Bean",
            location: "Iraq",
          },
        ],
      },
      {
        kind: "grid",
        title: "THE BEAUTY EDIT",
        subtitle: "A curated selection of beauty worth discovering.",
        ctaHref: "/collections/the-edit",
        ctaLabel: "DISCOVER THE EDIT →",
        limit: 4,
        hideBestSellerBadge: true,
      },
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
        title: "New",
        tabs: [
          { label: "New", filter: { isNew: true }, ctaHref: "/shop?category=fashion&sort=newest" },
          { label: "Bestseller", filter: { isBestSeller: true }, ctaHref: "/shop?category=fashion&sort=featured" },
          { label: "Letty’s Favourite", filter: { isFavourite: true }, ctaHref: "/collections/the-edit" },
        ],
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
        title: "New",
        tabs: [
          { label: "New", filter: { subcategorySlug: "new-season" }, ctaHref: "/shop?category=eyewear&sub=new-season" },
          { label: "Bestseller", filter: { isBestSeller: true }, ctaHref: "/shop?category=eyewear&sort=featured" },
          { label: "Letty’s Favourite", filter: { isFavourite: true }, ctaHref: "/collections/the-edit" },
        ],
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
export function filterRailProducts(pool: Product[], filter?: RailFilter): Product[] {
  if (!filter) return pool;
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
  if (filter.isFavourite) {
    const favs = out.filter((p) => p.collectionSlugs?.includes("the-edit") || p.rating >= 4.9);
    out = favs.length > 0 ? favs : out.slice(0, 8);
  }
  return out;
}
