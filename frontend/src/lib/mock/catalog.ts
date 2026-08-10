import type { Brand, Category, Collection } from "@/types";

export const brands: Brand[] = [
  { id: "b-letty", slug: "letty", name: "LETTY" },
  { id: "b-velvetine", slug: "velvetine", name: "VELVETINE" },
  { id: "b-or-noir", slug: "or-noir", name: "OR NOIR" },
  { id: "b-sable-co", slug: "sable-co", name: "SABLE & CO" },
  { id: "b-elan", slug: "elan", name: "ÉLAN" },
  { id: "b-maison-blanc", slug: "maison-blanc", name: "MAISON BLANC" },
];

export const categories: Category[] = [
  { id: "c-hair", slug: "hair", name: "Hair", description: "Rituals for silk-soft, luminous hair." },
  { id: "c-fragrance", slug: "fragrance", name: "Fragrance", description: "A wardrobe of scent." },
  { id: "c-skincare", slug: "skincare", name: "Skincare", description: "Ceremonial skincare, botanical actives." },
  { id: "c-makeup", slug: "makeup", name: "Makeup", description: "Complexion-first couture makeup." },
  { id: "c-fashion", slug: "fashion", name: "Fashion", description: "The Atelier edit — silk, cashmere, tailoring." },
  { id: "c-body", slug: "body", name: "Body", description: "Body care as daily ritual." },
  { id: "c-eyewear", slug: "eyewear", name: "Eyewear", description: "Designed to be noticed." },
];

export const collections: Collection[] = [
  {
    id: "col-the-edit",
    slug: "the-edit",
    name: "The Edit",
    description:
      "Our concierge's cross-category curation — the pieces defining the season at LETTY.",
    imageKey: "collectionBody",
  },
  {
    id: "col-golden-hour",
    slug: "golden-hour",
    name: "Golden Hour",
    description:
      "Warm, luminous fragrances built around amber, neroli and sun-warmed skin.",
    imageKey: "collectionFragrance",
  },
  {
    id: "col-silk-hair",
    slug: "silk-hair",
    name: "The Silk Hair Ritual",
    description:
      "A four-step ceremony for glass-like shine — cleanse, treat, seal, finish.",
    imageKey: "collectionHair",
  },
  {
    id: "col-glow-ritual",
    slug: "glow-ritual",
    name: "The Glow Ritual",
    description:
      "Skincare that layers light: vitamin C, ceramides and overnight renewal.",
    imageKey: "collectionSkincare",
  },
  {
    id: "col-atelier",
    slug: "atelier",
    name: "The Atelier",
    description:
      "Fashion in a neutral key — silk slips, cashmere wraps and precise tailoring.",
    imageKey: "collectionFashion",
  },
];
