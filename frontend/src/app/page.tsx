import type { Metadata } from "next";
import { Suspense } from "react";
import { Hero } from "@/components/home/hero";
import { EntranceReveal } from "@/components/home/entrance-reveal";
import { TrustBar } from "@/components/home/trust-bar";
import { EditorialCategories } from "@/components/home/editorial-services";
import { CampaignBanner } from "@/components/home/campaign-banner";
import { ProductRail } from "@/components/home/product-rail";
import { InstagramFeed } from "@/components/home/instagram-feed";
import { ProductRailSkeleton } from "@/components/home/product-rail-skeleton";
import { WhyLetty } from "@/components/home/why-letty";
import { DiscoverCta } from "@/components/home/discover-cta";
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
      <EntranceReveal />
      <Hero />
      <TrustBar />
      <EditorialCategories />
      <WhyLetty />
      <CampaignBanner />
      <Suspense fallback={<ProductRailSkeleton />}>
        <ProductRail products={cosmetics.slice(0, 4)} />
      </Suspense>
      <DiscoverCta />
      <InstagramFeed />
    </>
  );
}
