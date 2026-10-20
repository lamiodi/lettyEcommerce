import { getImage } from "./images";
import type { Product } from "../types";
import { MWAH_COPY } from "./mwah-copy";

export const MWAH_DISPATCH = "Late October–early November 2026";
export const MWAH_SLUG = "letty-mwah-lip-balm";

export const mwahProduct: Product = {
  id: "0e3b3f02-2682-4ee4-a118-39fc40b84d70",
  slug: MWAH_SLUG,
  name: "mwah Lip Balm",
  tagline: "A little love for your lips.",
  brandSlug: "letty",
  categorySlug: "makeup-beauty",
  subcategorySlug: "lip-care",
  basePriceUsd: 17,
  rating: 0,
  reviewCount: 0,
  isNew: true,
  isPreorder: true,
  preorderDispatch: MWAH_DISPATCH,
  collectionSlugs: ["the-edit"],
  relatedSlugs: ["letty-velvet-lip-liner", "letty-glass-lip-gloss"],
  description: MWAH_COPY.whatItIs[1],
  details: MWAH_COPY.productDetails,
  whatItIs: MWAH_COPY.whatItIs.join("\n\n"),
  whatItDoes: MWAH_COPY.whatItDoes.map(item => `• ${item}`).join("\n"),
  whatElseToKnow: MWAH_COPY.whatElse,
  ingredients: MWAH_COPY.ingredients,
  howToUseSteps: [{ title: "Your everyday ritual", text: MWAH_COPY.howToUse.join("\n\n") }],
  media: [
    { id: "mwah-ivory", imageKey: "mwahIvory", alt: getImage("mwahIvory").alt, position: 0 },
    { id: "mwah-noir", imageKey: "mwahNoir", alt: getImage("mwahNoir").alt, position: 1 },
  ],
  variants: [
    { id: "37a4a139-b5e0-4266-9190-a0ba452ae04e", sku: "LET-MWAH-IV", color: "Ivory Edition", colorHex: "#f4eee5", size: "10 ml", stockQuantity: 0, image: getImage("mwahIvory").src, images: [getImage("mwahIvory").src] },
    { id: "dd58882a-1d77-45e9-823f-12c491034a52", sku: "LET-MWAH-NR", color: "Noir Edition", colorHex: "#22201f", size: "10 ml", stockQuantity: 0, image: getImage("mwahNoir").src, images: [getImage("mwahNoir").src] },
  ],
};
