"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Check, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { LettyImage } from "@/components/shared/letty-image";
import { LinedButton } from "@/components/shared/lined-button";
import { ProductCard } from "@/components/product/product-card";
import { Reveal } from "@/components/shared/reveal";
import { Price } from "@/components/shared/price";
import { useCartStore } from "@/lib/store/cart";
import { formatPrice } from "@/lib/utils";
import type { Product } from "@/types";

interface BeautyEditPageProps {
  products: Product[];
  brandNames: Record<string, string>;
}

export function BeautyEditPage({ products, brandNames }: BeautyEditPageProps) {
  const addLine = useCartStore((s) => s.addLine);
  const [selectedShade, setSelectedShade] = useState("Nude Soie");

  // Reference actual catalog products
  const lipstick = products.find((p) => p.slug === "satin-matte-lipstick") || products[0];
  const highlighter =
    products.find((p) => p.slug === "glow-drops-highlighter") ||
    products.find((p) => p.slug === "lash-sculpt-mascara") ||
    products[1] ||
    products[0];

  const pairPrice = (lipstick?.basePriceUsd ?? 38) + (highlighter?.basePriceUsd ?? 44);

  const handleShopPair = () => {
    if (lipstick?.variants[0]) {
      addLine({ productSlug: lipstick.slug, variantId: lipstick.variants[0].id, quantity: 1 });
    }
    if (highlighter?.variants[0]) {
      addLine({ productSlug: highlighter.slug, variantId: highlighter.variants[0].id, quantity: 1 });
    }
    toast.success(`${lipstick?.name} & ${highlighter?.name} added to your bag`);
  };

  const shades = [
    { name: "Nude Soie", hex: "#B07D62", mood: "Warm silk neutral for effortless daytime elegance" },
    { name: "Rouge Éternel", hex: "#8E2A2B", mood: "Iconic couture red with a weightless satin-matte finish" },
    { name: "Rose Boisé", hex: "#9E5B5F", mood: "Muted rosewood with soft-focus natural warmth" },
    { name: "Champagne Lumière", hex: "#E7CDA6", mood: "Liquid pearl highlight for a candlelit glow" },
  ];

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
              alt="The Beauty Edit — Curated by LETTY"
              sizes="(max-width: 1280px) 100vw, 1280px"
              priority
              quality={95}
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
                    quality={95}
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
                  A defined velvet contour softened by high-shine hydration. Our signature ritual combines weightless satin-matte color with an ultra-nourishing radiant finish.
                </p>

                <div className="mt-8 flex flex-col gap-4 border-l-2 border-gold/40 pl-4">
                  <div>
                    <p className="text-[11px] font-medium uppercase tracking-luxe text-stone">Step 1 · Satin Colour & Hydration</p>
                    <p className="font-serif text-base text-ink font-medium">{lipstick?.name ?? "Satin Matte Lipstick"}</p>
                  </div>
                  <div>
                    <p className="text-[11px] font-medium uppercase tracking-luxe text-stone">Step 2 · Pure Radiance & Glow</p>
                    <p className="font-serif text-base text-ink font-medium">{highlighter?.name ?? "Glow Drops Highlighter"}</p>
                  </div>
                </div>

                <div className="mt-10">
                  <LinedButton href="/shop?category=makeup" tone="ink" width="w-[240px]">
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
                  Pairing one weightless satin lipstick with luminous glow drops. Designed in harmony to wear all day without feathering or heavy residue.
                </p>

                <div className="mt-6 flex items-baseline gap-3">
                  <span className="font-serif text-2xl font-medium text-ink">
                    {formatPrice(pairPrice)}
                  </span>
                  <span className="text-xs uppercase tracking-luxe text-stone">
                    (Set of 2 Pieces)
                  </span>
                </div>

                <div className="mt-8 flex gap-4">
                  <button
                    type="button"
                    onClick={handleShopPair}
                    className="group flex flex-col items-center w-[240px]"
                  >
                    <hr className="w-full border-ink/30 transition-colors group-hover:border-ink/60" />
                    <span className="w-full py-3.5 text-[11px] font-medium text-ink transition-colors hover:text-stone tracking-[0.2em] uppercase text-center">
                      Shop the Pair
                    </span>
                    <hr className="w-full border-ink/30 transition-colors group-hover:border-ink/60" />
                  </button>
                </div>
              </Reveal>
            </div>

            <div className="order-1 lg:order-2 lg:col-span-6">
              <Reveal>
                <div className="relative aspect-[4/5] overflow-hidden bg-secondary">
                  <LettyImage
                    imageKey="deptMakeupEditorial"
                    alt="The Perfect Pair product shot"
                    sizes="(max-width: 1024px) 100vw, 50vw"
                    quality={95}
                    className="object-cover object-[center_20%]"
                  />
                  <div className="absolute bottom-4 right-4 bg-ink px-3.5 py-1.5 text-[10px] font-medium uppercase tracking-luxe text-ivory">
                    Lip + Glow Duo
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
              A curated selection of recommended shades and swatches tailored for natural contrast and all-day radiance.
            </p>
          </Reveal>

          <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {shades.map((s, i) => {
              const isSelected = selectedShade === s.name;
              return (
                <Reveal key={s.name} delay={0.05 * i}>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedShade(s.name);
                      toast.success(`Selected shade: ${s.name}`);
                    }}
                    className={`flex h-full w-full flex-col items-start border p-6 text-left transition-all duration-300 ${
                      isSelected
                        ? "border-ink bg-ivory shadow-md"
                        : "border-line bg-card hover:border-stone"
                    }`}
                  >
                    <div className="flex w-full items-center justify-between">
                      <div
                        className="h-12 w-12 rounded-full border border-black/10 shadow-inner"
                        style={{ backgroundColor: s.hex }}
                      />
                      {isSelected && (
                        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-ink text-ivory">
                          <Check className="h-3.5 w-3.5" />
                        </span>
                      )}
                    </div>
                    <h3 className="mt-5 font-serif text-lg font-medium text-ink">{s.name}</h3>
                    <p className="mt-2 text-xs leading-relaxed text-stone">{s.mood}</p>
                    <span className="mt-6 text-[10px] font-semibold uppercase tracking-luxe text-gold">
                      {isSelected ? "Active Match" : "Select Shade"}
                    </span>
                  </button>
                </Reveal>
              );
            })}
          </div>

          <div className="mt-12 flex justify-center">
            <LinedButton href="/shop?category=makeup" tone="ink" width="w-[260px]">
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
              Every curated piece currently in stock.
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
