import type { Metadata } from "next";
import { Suspense } from "react";
import { Hero } from "@/components/home/hero";
import { EntranceReveal } from "@/components/home/entrance-reveal";
import { TrustBar } from "@/components/home/trust-bar";
import { WorldsDoorway } from "@/components/home/worlds-doorway";
import { ProductRail } from "@/components/home/product-rail";
import { InstagramFeed } from "@/components/home/instagram-feed";
import { ProductRailSkeleton } from "@/components/home/product-rail-skeleton";
import { WhyLetty } from "@/components/home/why-letty";
import { DiscoverCta } from "@/components/home/discover-cta";
import { getBestSellers } from "@/lib/data/products";

export const metadata: Metadata = {
  alternates: { canonical: "/" },
};

/** Homepage, the Dior way: campaign hero → world showcases → brand story → selection carousel. */
export default async function HomePage() {
  const bestSellers = await getBestSellers(8);

  return (
    <>
      <EntranceReveal />
      <Hero />
      <TrustBar />
      <WorldsDoorway />
      <WhyLetty />
      <Suspense fallback={<ProductRailSkeleton />}>
        <ProductRail products={bestSellers} />
      </Suspense>
      <DiscoverCta />
      <InstagramFeed />
    </>
  );
}
