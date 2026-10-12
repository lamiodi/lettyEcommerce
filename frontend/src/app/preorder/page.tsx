import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PreorderExperience } from "@/components/preorder/preorder-experience";
import { getProductBySlug } from "@/lib/data/products";
import { getImage } from "@/lib/images";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.houseofletty.com";
const CTA_IMAGE = "/images/IMG_7714.webp";
const SLUG = "letty-lash-book-kit";

export const metadata: Metadata = {
  title: "The Lash Book — Pre-Order | LETTY",
  description:
    "Pre-order the Letty Lash Book Kit — 544 reusable cluster lashes across four volumes (60D, 100D, 120D, 150D) with lash glue and remover included. £12.12.",
  alternates: { canonical: "/preorder" },
  openGraph: {
    type: "website",
    title: "The Lash Book — Pre-Order | LETTY",
    description:
      "544 reusable cluster lashes. Four volumes. One book. Pre-order the Letty Lash Book Kit for £12.12.",
    url: "/preorder",
    images: [{ url: `${siteUrl}${CTA_IMAGE}`, alt: "The Lash Book — LETTY pre-order" }],
  },
};

export default async function PreorderPage() {
  const product = await getProductBySlug(SLUG);
  if (!product) notFound();

  // Pre-orders are honest about availability — schema.org/PreOrder, not InStock.
  const productJsonLd = {
    "@context": "https://schema.org/",
    "@type": "Product",
    name: product.name,
    description: product.description,
    image: product.media.map((m) => `${siteUrl}${getImage(m.imageKey).src}`),
    sku: product.variants[0]?.sku ?? product.slug,
    url: `${siteUrl}/products/${product.slug}`,
    brand: { "@type": "Brand", name: "LETTY" },
    offers: {
      "@type": "Offer",
      url: `${siteUrl}/preorder`,
      priceCurrency: "GBP",
      price: product.basePriceUsd,
      availability: "https://schema.org/PreOrder",
      itemCondition: "https://schema.org/NewCondition",
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }}
      />
      <PreorderExperience product={product} ctaImage={CTA_IMAGE} />
    </>
  );
}
