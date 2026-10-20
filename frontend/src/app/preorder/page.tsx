import type { Metadata } from "next";
import { MwahPreorder } from "@/components/preorder/mwah-preorder";
import { getProductBySlug } from "@/lib/data/products";
import { mwahProduct, MWAH_DISPATCH, MWAH_SLUG } from "@/lib/mwah";
import { getImage } from "@/lib/images";

export const metadata: Metadata = {
  title: "Meet mwah. Lip Balm Preorder",
  description: `A little love for your lips. Preorder LETTY mwah Lip Balm in Ivory or Noir for £17. Estimated dispatch: ${MWAH_DISPATCH}.`,
  alternates: { canonical: "/preorder" },
  openGraph: { title: "Meet mwah. | LETTY", description: "Two editions. One little ritual. Discover the £17 mwah Lip Balm preorder.", url: "/preorder", images: [{ url: getImage("mwahIvory").src, alt: "LETTY mwah Lip Balm, Ivory Edition" }] },
};

export default async function PreorderPage() {
  const product = await getProductBySlug(MWAH_SLUG) ?? mwahProduct;
  return <MwahPreorder product={product} />;
}
