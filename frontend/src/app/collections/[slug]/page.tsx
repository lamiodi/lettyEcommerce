import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { ProductCard } from "@/components/product/product-card";
import { LettyImage } from "@/components/shared/letty-image";
import { Reveal } from "@/components/shared/reveal";
import { getBrands, getCollectionBySlug, getCollections } from "@/lib/data/catalog";
import { getProducts } from "@/lib/data/products";

interface CollectionDetailPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  const collections = await getCollections();
  return collections.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({ params }: CollectionDetailPageProps): Promise<Metadata> {
  const { slug } = await params;
  const collection = await getCollectionBySlug(slug);
  if (!collection) return {};
  return {
    title: collection.name,
    description: collection.description,
    alternates: { canonical: `/collections/${collection.slug}` },
  };
}

export default async function CollectionDetailPage({ params }: CollectionDetailPageProps) {
  const { slug } = await params;
  const collection = await getCollectionBySlug(slug);
  if (!collection) notFound();

  const [products, brands] = await Promise.all([
    getProducts({ collectionSlug: collection.slug, sort: "featured" }),
    getBrands(),
  ]);
  const brandNames = Object.fromEntries(brands.map((b) => [b.slug, b.name]));

  return (
    <div>
      <section className="relative overflow-hidden bg-ink">
        <div className="relative h-[46vh] min-h-[360px] w-full">
          <LettyImage
            imageKey={collection.imageKey}
            alt={collection.name}
            sizes="100vw"
            priority
            className="object-center"
          />
          <div
            aria-hidden
            className="absolute inset-0 bg-gradient-to-t from-ink/80 via-ink/30 to-ink/10"
          />
          <div className="absolute inset-0 flex items-end">
            <div className="mx-auto w-full max-w-7xl px-4 pb-12 md:px-8">
              <Reveal>
                <p className="text-xs font-medium uppercase tracking-luxe text-gold">
                  Collection
                </p>
                <h1 className="mt-3 font-serif text-4xl font-medium text-ivory md:text-6xl">
                  {collection.name}
                </h1>
                <p className="mt-3 max-w-xl text-sm leading-relaxed text-ivory/85 md:text-base">
                  {collection.description}
                </p>
              </Reveal>
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 py-12 md:px-8 md:py-16">
        <div className="flex items-center justify-between">
          <Link
            href="/collections"
            className="inline-flex items-center gap-2 text-xs font-medium uppercase tracking-luxe-sm text-stone transition hover:text-ink"
          >
            <ArrowLeft className="h-3.5 w-3.5" aria-hidden />
            All collections
          </Link>
          <p className="text-sm text-stone">{products.length} pieces</p>
        </div>

        <div className="mt-8 grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-3 md:gap-x-5 lg:grid-cols-4">
          {products.map((product, i) => (
            <Reveal key={product.id} delay={0.04 * (i % 4)}>
              <ProductCard product={product} brandName={brandNames[product.brandSlug]} />
            </Reveal>
          ))}
        </div>
      </div>
    </div>
  );
}
