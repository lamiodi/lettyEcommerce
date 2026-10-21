import type { Brand, Category, Collection } from "@/types";

export const brands: Brand[] = [
  { id: "b-letty", slug: "letty", name: "LETTY" },
];

export const categories: Category[] = [
  {
    id: "c-makeup-beauty",
    slug: "makeup-beauty",
    name: "Makeup & Beauty",
    description: "Lip colour, lip care and lash essentials for your everyday beauty routine.",
  },
  {
    id: "c-fashion",
    slug: "fashion",
    name: "Fashion",
    description: "The Atelier edit, silk, cashmere, and precise tailoring.",
  },
  {
    id: "c-fragrance",
    slug: "fragrance",
    name: "Fragrance",
    description: "A wardrobe of scent: eaux de parfum, extrait, and signature blends.",
  },
  {
    id: "c-eyewear",
    slug: "eyewear",
    name: "Eyewear",
    description: "Sculpted frames and signature silhouettes, designed to be noticed.",
  },
];

export const collections: Collection[] = [
  {
    id: "col-the-edit",
    slug: "the-edit",
    name: "The Edit",
    description:
      "Discover LETTY lip liner, lip gloss, lash essentials and the mwah Lip Balm preorder.",
    imageKey: "mwahIvory",
  },
  {
    id: "col-golden-hour",
    slug: "golden-hour",
    name: "Golden Hour",
    description:
      "Explore LETTY lip liner and gloss shades for your next lip look.",
    imageKey: "lettyLipGloss",
  },
];
