import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ProductAccordions } from "@/components/product/product-accordions";
import { ProductCard } from "@/components/product/product-card";
import { ProductGallery } from "@/components/product/product-gallery";
import { PurchasePanel } from "@/components/product/purchase-panel";
import { RecentlyViewed } from "@/components/product/recently-viewed";
import { ReviewsSection } from "@/components/product/reviews-section";
import { Reveal } from "@/components/shared/reveal";
import { SectionHeading } from "@/components/shared/section-heading";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { getBrands, getCategories } from "@/lib/data/catalog";
import { getProductBySlug, getProducts, getRelatedProducts } from "@/lib/data/products";
import { getReviewsByProduct } from "@/lib/data/reviews";
import { products as allProducts } from "@/lib/mock/products";

interface ProductPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return allProducts.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return {};
  return {
    title: product.name,
    description: product.description,
    alternates: { canonical: `/products/${product.slug}` },
    openGraph: {
      type: "website",
      title: `${product.name} | LETTY`,
      description: product.description,
      url: `/products/${product.slug}`,
    },
    twitter: {
      card: "summary_large_image",
      title: `${product.name} | LETTY`,
      description: product.description,
    },
  };
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();

  const [brands, categories, reviews, related] = await Promise.all([
    getBrands(),
    getCategories(),
    getReviewsByProduct(product.id),
    getRelatedProducts(product.slug, 4),
  ]);

  const brandName = brands.find((b) => b.slug === product.brandSlug)?.name;
  const category = categories.find((c) => c.slug === product.categorySlug);
  const brandNames = Object.fromEntries(brands.map((b) => [b.slug, b.name]));

  // Complete the look — cross-category pieces from the same collections
  const relatedSlugs = new Set(related.map((p) => p.slug));
  const lookProducts = await getProducts({ sort: "featured" }).then((list) =>
    list
      .filter(
        (p) =>
          p.slug !== product.slug &&
          !relatedSlugs.has(p.slug) &&
          p.categorySlug !== product.categorySlug &&
          p.collectionSlugs.some((c) => product.collectionSlugs.includes(c)),
      )
      .slice(0, 4),
  );

  const badge = product.compareAtPriceUsd
    ? "Sale"
    : product.isNew
      ? "New"
      : product.isBestSeller
        ? "Best Seller"
        : null;

  const productJsonLd = {
    "@context": "https://schema.org/",
    "@type": "Product",
    name: product.name,
    description: product.description,
    sku: product.variants[0]?.sku,
    brand: {
      "@type": "Brand",
      name: brandName ?? "LETTY",
    },
    offers: {
      "@type": "Offer",
      priceCurrency: "USD",
      price: product.basePriceUsd,
      availability: "https://schema.org/InStock",
    },
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: product.rating,
      reviewCount: product.reviewCount,
    },
  };

  const breadcrumbItems: Array<{ "@type": string; position: number; name: string; item: string }> = [
    { "@type": "ListItem", position: 1, name: "Home", item: "/" },
    { "@type": "ListItem", position: 2, name: "Shop", item: "/shop" },
  ];
  if (category) {
    breadcrumbItems.push({
      "@type": "ListItem",
      position: 3,
      name: category.name,
      item: `/shop?category=${category.slug}`,
    });
  }
  breadcrumbItems.push({
    "@type": "ListItem",
    position: breadcrumbItems.length + 1,
    name: product.name,
    item: `/products/${product.slug}`,
  });

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: breadcrumbItems,
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 md:px-8 md:py-12">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <Breadcrumb>
        <BreadcrumbList className="text-xs uppercase tracking-luxe-sm text-stone">
          <BreadcrumbItem>
            <BreadcrumbLink render={<Link href="/" />}>Home</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink render={<Link href="/shop" />}>Shop</BreadcrumbLink>
          </BreadcrumbItem>
          {category && (
            <>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink
                  render={<Link href={`/shop?category=${category.slug}`} />}
                >
                  {category.name}
                </BreadcrumbLink>
              </BreadcrumbItem>
            </>
          )}
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage className="text-ink">{product.name}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="mt-8 grid grid-cols-1 gap-10 lg:grid-cols-2 lg:gap-16">
        <ProductGallery media={product.media} productName={product.name} badge={badge} />
        <div className="lg:sticky lg:top-28 lg:self-start">
          <PurchasePanel product={product} brandName={brandName} />
          <ProductAccordions product={product} />
        </div>
      </div>

      <ReviewsSection
        reviews={reviews}
        rating={product.rating}
        reviewCount={product.reviewCount}
      />

      {lookProducts.length > 0 && (
        <section aria-labelledby="look-heading" className="mt-20 bg-secondary px-6 py-12 md:px-12 md:py-16 rounded-2xl">
          <SectionHeading
            eyebrow="Style It With"
            title="Complete the look"
            description="Pieces from the same edit, chosen to layer beautifully together."
          />
          <span id="look-heading" className="sr-only">
            Complete the look
          </span>
          <div className="mt-10 grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-4 md:gap-x-5">
            {lookProducts.map((p, i) => (
              <Reveal key={p.id} delay={0.05 * i}>
                <ProductCard product={p} brandName={brandNames[p.brandSlug]} />
              </Reveal>
            ))}
          </div>
        </section>
      )}

      {related.length > 0 && (
        <section aria-labelledby="related-heading" className="mt-20 border-t border-line pt-16">
          <SectionHeading eyebrow="You May Also Like" title="Related pieces" />
          <span id="related-heading" className="sr-only">
            Related products
          </span>
          <div className="mt-10 grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-4 md:gap-x-5">
            {related.map((p, i) => (
              <Reveal key={p.id} delay={0.05 * i}>
                <ProductCard product={p} brandName={brandNames[p.brandSlug]} />
              </Reveal>
            ))}
          </div>
        </section>
      )}

      <RecentlyViewed currentSlug={product.slug} />
    </div>
  );
}
