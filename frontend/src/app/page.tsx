import type { Metadata } from "next";
import { Hero } from "@/components/home/hero";
import { EditorialCategories } from "@/components/home/editorial-services";
import { CampaignBanner } from "@/components/home/campaign-banner";
import { ProductRail } from "@/components/home/product-rail";
import { InstagramFeed } from "@/components/home/instagram-feed";
import { getProducts } from "@/lib/data/products";

export const metadata: Metadata = {
  alternates: { canonical: "/" },
};

/** Homepage mirrors the template: Hero → Services → Campaign band → Cosmetics → Instagram. */
export default async function HomePage() {
  const cosmetics = await getProducts({
    categorySlug: "makeup",
    sort: "featured",
  });

  return (
    <>
      <Hero />
      <EditorialCategories />
      <CampaignBanner />
      <ProductRail products={cosmetics.slice(0, 4)} />
      <InstagramFeed />
    </>
  );
}
