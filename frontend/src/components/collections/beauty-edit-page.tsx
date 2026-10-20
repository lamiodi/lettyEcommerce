"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { LettyImage } from "@/components/shared/letty-image";
import { LinedButton } from "@/components/shared/lined-button";
import { ProductCard } from "@/components/product/product-card";
import { Reveal } from "@/components/shared/reveal";
import { Price } from "@/components/shared/price";
import type { Product } from "@/types";

interface BeautyEditPageProps {
  products: Product[];
  brandNames: Record<string, string>;
}

export function BeautyEditPage({ products, brandNames }: BeautyEditPageProps) {
  const liner = products.find((product) => product.slug === "letty-velvet-lip-liner");
  const gloss = products.find((product) => product.slug === "letty-glass-lip-gloss");
  const pairPrice = liner && gloss ? liner.basePriceUsd + gloss.basePriceUsd : null;
  const shades = [liner, gloss].flatMap((product) => product
    ? product.variants.slice(0, 2).map((variant) => ({
        name: variant.color || variant.sku,
        hex: variant.colorHex || "#EDE5DA",
        product: product.name,
        href: `/products/${product.slug}`,
      }))
    : []);

  return (
    <div className="bg-ivory text-ink">
      {/* 1. Header & Curated Introduction */}
      <section className="mx-auto max-w-7xl px-4 pt-12 pb-8 sm:px-6 md:pt-16 md:pb-12 md:px-8 text-center">
        <Link
          href="/departments/makeup-beauty"
          className="inline-flex items-center gap-2 text-xs font-medium uppercase tracking-luxe-sm text-stone transition hover:text-ink mb-6"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Makeup & Beauty
        </Link>
        <Reveal>
          <p className="text-xs font-medium uppercase tracking-[0.25em] text-gold">
            Curated by LETTY
          </p>
          <h1 className="mt-3 font-serif text-4xl font-normal uppercase tracking-[0.16em] text-ink sm:text-5xl md:text-6xl">
            THE BEAUTY EDIT
          </h1>
        </Reveal>
      </section>

      {/* Large beauty campaign visual + introduction */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 md:px-8">
        <Reveal>
          <div className="relative aspect-[16/10] sm:aspect-[16/8] md:aspect-[21/9] w-full max-h-[620px] overflow-hidden bg-ink shadow-sm">
            <LettyImage
              imageKey="deptMakeupHero"
              alt="The Beauty Edit, Curated by LETTY"
              sizes="(max-width: 1280px) 100vw, 1280px"
              priority
              quality={85}
              className="object-cover object-[center_20%] sm:object-[center_25%]"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-ink/60 via-transparent to-transparent" />
          </div>
          <div className="mx-auto max-w-2xl text-center pt-8 pb-12 sm:pt-10 sm:pb-16">
            <p className="font-serif text-xl sm:text-2xl italic leading-relaxed text-ink/90">
              &ldquo;A considered selection of beauty essentials, chosen for the rituals that make every day feel a little more special.&rdquo;
            </p>
          </div>
        </Reveal>
      </section>

      {/* 2. THE EVERYDAY LIP */}
      <section className="border-t border-line py-16 md:py-24 bg-card/40">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 md:px-8">
          <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-12 lg:gap-16">
            <div className="lg:col-span-6">
              <Reveal>
                <div className="relative aspect-[4/5] overflow-hidden bg-secondary">
                  <LettyImage
                    imageKey="tileMakeup"
                    alt="The Everyday Lip editorial look"
                    sizes="(max-width: 1024px) 100vw, 50vw"
                    quality={85}
                    className="object-cover object-[center_20%]"
                  />
                  <div className="absolute bottom-4 left-4 bg-ivory/95 px-3.5 py-1.5 text-[10px] font-medium uppercase tracking-luxe text-ink">
                    Look 01 · Everyday
                  </div>
                </div>
              </Reveal>
            </div>

            <div className="flex flex-col items-start lg:col-span-6">
              <Reveal>
                <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-gold">
                  Curated Look
                </p>
                <h2 className="mt-2 font-serif text-3xl font-medium uppercase tracking-[0.16em] text-ink sm:text-4xl">
                  THE EVERYDAY LIP
                </h2>
                <p className="mt-4 text-sm leading-relaxed text-stone md:text-base">
                  Define your lips with Velvet Sculpt Lip Liner, then finish with Glass Shine Lip Gloss. Explore the shade options on each product page to create your own pairing.
                </p>

                <div className="mt-8 flex flex-col gap-4 border-l-2 border-gold/40 pl-4">
                  <div>
                    <p className="text-[11px] font-medium uppercase tracking-luxe text-stone">Step 1 · Define</p>
                    <p className="font-serif text-base text-ink font-medium">{liner?.name ?? "Explore lip liner"}</p>
                  </div>
                  <div>
                    <p className="text-[11px] font-medium uppercase tracking-luxe text-stone">Step 2 · Shine</p>
                    <p className="font-serif text-base text-ink font-medium">{gloss?.name ?? "Explore lip gloss"}</p>
                  </div>
                </div>

                <div className="mt-10">
                  <LinedButton href="/shop?category=makeup-beauty" tone="ink" width="w-[240px]">
                    Shop the Look
                  </LinedButton>
                </div>
              </Reveal>
            </div>
          </div>
        </div>
      </section>

      {/* 3. THE PERFECT PAIR */}
      <section className="border-t border-line py-16 md:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 md:px-8">
          <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-12 lg:gap-16">
            <div className="order-2 flex flex-col items-start lg:order-1 lg:col-span-6">
              <Reveal>
                <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-gold">
                  Duet Essentials
                </p>
                <h2 className="mt-2 font-serif text-3xl font-medium uppercase tracking-[0.16em] text-ink sm:text-4xl">
                  THE PERFECT PAIR
                </h2>
                <p className="mt-4 text-sm leading-relaxed text-stone md:text-base">
                  A lip liner and gloss pairing, chosen by you. Select your preferred shades before adding each product to your bag.
                </p>

                <div className="mt-6 flex items-baseline gap-3">
                  <span className="font-serif text-2xl font-medium text-ink">
                    {pairPrice !== null && <Price price={pairPrice} />}
                  </span>
                  <span className="text-xs uppercase tracking-luxe text-stone">
                    Total for one liner and one gloss
                  </span>
                </div>

                <div className="mt-8 flex gap-4">
                  <Link
                    href="/shop?category=makeup-beauty"
                    className="group flex flex-col items-center w-[240px]"
                  >
                    <hr className="w-full border-ink/30 transition-colors group-hover:border-ink/60" />
                    <span className="w-full py-3.5 text-[11px] font-medium text-ink transition-colors hover:text-stone tracking-[0.2em] uppercase text-center">
                      Choose Your Shades
                    </span>
                    <hr className="w-full border-ink/30 transition-colors group-hover:border-ink/60" />
                  </Link>
                </div>
              </Reveal>
            </div>

            <div className="order-1 lg:order-2 lg:col-span-6">
              <Reveal>
                <div className="relative aspect-[4/5] overflow-hidden bg-secondary">
                  <LettyImage
                    imageKey="lettyLipGloss"
                    alt="LETTY Glass Shine Lip Gloss"
                    sizes="(max-width: 1024px) 100vw, 50vw"
                    quality={85}
                    className="object-cover object-[center_20%]"
                  />
                  <div className="absolute bottom-4 right-4 bg-ink px-3.5 py-1.5 text-[10px] font-medium uppercase tracking-luxe text-ivory">
                    Liner + Gloss
                  </div>
                </div>
              </Reveal>
            </div>
          </div>
        </div>
      </section>

      {/* 4. THE SHADE EDIT */}
      <section className="border-t border-line py-16 md:py-24 bg-card/30">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 md:px-8">
          <Reveal className="flex flex-col items-center text-center">
            <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-gold">
              Color Palette
            </p>
            <h2 className="mt-2 font-serif text-3xl font-medium uppercase tracking-[0.16em] text-ink sm:text-4xl">
              THE SHADE EDIT
            </h2>
            <p className="mt-3 max-w-xl text-sm leading-relaxed text-stone md:text-base">
              A few shades from our lip liner and gloss range. Open the product page to see all shades and select yours.
            </p>
          </Reveal>

          <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {shades.map((s, i) => {
              return (
                <Reveal key={s.name} delay={0.05 * i}>
                  <Link
                    href={s.href}
                    className="flex h-full w-full flex-col items-start border border-line bg-card p-6 text-left transition-colors hover:border-stone"
                  >
                    <div className="flex w-full items-center justify-between">
                      <div
                        className="h-12 w-12 rounded-full border border-black/10 shadow-inner"
                        style={{ backgroundColor: s.hex }}
                      />
                    </div>
                    <h3 className="mt-5 font-serif text-lg font-medium text-ink">{s.name}</h3>
                    <p className="mt-2 text-xs leading-relaxed text-stone">{s.product}</p>
                    <span className="mt-6 text-[10px] font-semibold uppercase tracking-luxe text-gold">
                      View Product &amp; Shades
                    </span>
                  </Link>
                </Reveal>
              );
            })}
          </div>

          <div className="mt-12 flex justify-center">
            <LinedButton href="/shop?category=makeup-beauty" tone="ink" width="w-[260px]">
              Find Your Shade
            </LinedButton>
          </div>
        </div>
      </section>

      {/* 5. Curated Products Grid */}
      <section className="border-t border-line py-16 md:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 md:px-8">
          <Reveal className="flex flex-col items-center text-center mb-12">
            <h2 className="font-serif text-2xl font-medium uppercase tracking-[0.2em] text-ink sm:text-3xl">
              THE FULL EDIT
            </h2>
            <p className="mt-2 text-sm text-stone">
              Explore the LETTY range, including available products and upcoming preorders.
            </p>
          </Reveal>

          <div className="grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-3 lg:grid-cols-4 md:gap-x-5">
            {products.map((product, i) => (
              <Reveal key={product.id} delay={0.04 * (i % 4)}>
                <ProductCard
                  product={product}
                  brandName={brandNames[product.brandSlug]}
                  hideBestSellerBadge={true}
                />
              </Reveal>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
