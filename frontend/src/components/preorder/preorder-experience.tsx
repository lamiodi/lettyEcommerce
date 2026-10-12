"use client";

import { useRef } from "react";
import Link from "next/link";
import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { Check, ShoppingBag, Truck } from "lucide-react";
import { toast } from "sonner";
import { LettyImage } from "@/components/shared/letty-image";
import { LinedButton } from "@/components/shared/lined-button";
import { Price } from "@/components/shared/price";
import { Reveal } from "@/components/shared/reveal";
import { SectionHeading } from "@/components/shared/section-heading";
import { TextMaskReveal } from "@/components/shared/text-mask-reveal";
import { useCartStore } from "@/lib/store/cart";
import { DURATION, heroFadeUp } from "@/lib/motion";
import { cn } from "@/lib/utils";
import type { Product } from "@/types";

interface PreorderExperienceProps {
  product: Product;
  ctaImage: string;
}

const VOLUMES = [
  { d: "60D", label: "Feathered" },
  { d: "100D", label: "Everyday" },
  { d: "120D", label: "Volume" },
  { d: "150D", label: "Mega Volume" },
];

/**
 * /preorder — the Lash Book first-run campaign.
 *
 * Layout follows the house grammar: a full-bleed campaign hero (the CTA
 * artwork) with masked serif headline and lined button, a PDP-style reserve
 * section, an ink "volumes" band, the application ritual, and a closing
 * full-bleed CTA that echoes the hero.
 */
export function PreorderExperience({ product, ctaImage }: PreorderExperienceProps) {
  const addLine = useCartStore((s) => s.addLine);
  const reduceMotion = useReducedMotion();

  const heroRef = useRef<HTMLElement>(null);
  const { scrollYProgress: heroProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });
  const heroParallaxY = useTransform(heroProgress, [0, 1], ["0%", "10%"]);

  const closeRef = useRef<HTMLElement>(null);
  const { scrollYProgress: closeProgress } = useScroll({
    target: closeRef,
    offset: ["start end", "end start"],
  });
  const closeParallaxY = useTransform(closeProgress, [0, 1], ["-4%", "4%"]);

  const variant = product.variants[0];
  const priceLabel = new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
  }).format(product.basePriceUsd);

  const reserve = () => {
    if (!variant) return;
    addLine({ productSlug: product.slug, variantId: variant.id, quantity: 1 });
    toast.success("The Lash Book is reserved in your bag");
  };

  return (
    <main className="bg-background text-foreground">
      {/* ── Campaign hero — the CTA artwork ─────────────────────────── */}
      <section
        ref={heroRef}
        aria-labelledby="preorder-heading"
        className="relative flex min-h-[92svh] items-end overflow-hidden bg-ink"
      >
        <motion.div
          aria-hidden
          className="absolute inset-0"
          initial={{ scale: 1.08, opacity: 0.8 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: DURATION.ambient, ease: "easeOut" }}
          style={{ y: reduceMotion ? 0 : heroParallaxY }}
        >
          <LettyImage
            imageKey={ctaImage}
            alt="The Lash Book — LETTY pre-order campaign"
            priority
            quality={80}
            sizes="100vw"
            className="object-cover object-center"
          />
        </motion.div>
        <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-ink/85 via-ink/35 to-ink/10" />

        <motion.div
          className="relative z-10 flex w-full max-w-2xl flex-col items-start px-6 pb-14 sm:pb-16 md:pb-20 md:ml-10 lg:ml-16"
          initial="hidden"
          animate="visible"
        >
          <motion.p
            variants={heroFadeUp}
            custom={0.45}
            className="text-[11px] font-medium uppercase tracking-luxe text-ivory/80"
          >
            Pre-Order · The First Run
          </motion.p>
          <h1
            id="preorder-heading"
            className="mt-4 font-serif font-light text-3xl sm:text-4xl md:text-5xl lg:text-6xl uppercase tracking-[0.16em] sm:tracking-[0.2em] text-ivory leading-[1.2] [text-shadow:_0_1px_24px_rgb(0_0_0_/_45%)]"
          >
            <TextMaskReveal text="The Lash Book" delay={0.35} />
          </h1>
          <motion.p
            variants={heroFadeUp}
            custom={0.55}
            className="mt-5 max-w-md text-sm leading-relaxed text-ivory/90 [text-shadow:_0_1px_16px_rgb(0_0_0_/_35%)] md:text-base"
          >
            544 reusable cluster lashes. Four volumes. One book — glue, remover
            and everything in between.
          </motion.p>
          <motion.div variants={heroFadeUp} custom={0.65} className="mt-9 w-full max-w-[260px]">
            <LinedButton href="#reserve" tone="ivory" width="w-full">
              Reserve Yours · {priceLabel}
            </LinedButton>
          </motion.div>
        </motion.div>
      </section>

      {/* ── Reserve — gallery + purchase panel ──────────────────────── */}
      <section
        id="reserve"
        aria-labelledby="reserve-heading"
        className="mx-auto max-w-7xl scroll-mt-20 px-4 py-16 md:px-8 md:py-24"
      >
        <h2 id="reserve-heading" className="sr-only">
          Reserve the Lash Book
        </h2>
        <div className="grid grid-cols-1 items-start gap-10 lg:grid-cols-2 lg:gap-16">
          {/* Gallery — square frames so the kit flat-lays are never cropped */}
          <div>
            <Reveal>
              <div className="relative aspect-square overflow-hidden rounded-2xl bg-secondary">
                <span className="absolute left-4 top-4 z-20 rounded-full bg-ivory/90 px-3 py-1.5 text-[0.65rem] font-semibold uppercase tracking-luxe-sm text-ink shadow-sm backdrop-blur-xs">
                  Pre-Order
                </span>
                <LettyImage
                  imageKey={product.media[0]?.imageKey ?? ""}
                  alt={product.media[0]?.alt ?? product.name}
                  priority
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  className="object-cover"
                />
              </div>
            </Reveal>
            <div className="mt-4 grid grid-cols-2 gap-4">
              {product.media.slice(1).map((m, i) => (
                <Reveal key={m.id} delay={0.08 * (i + 1)}>
                  <div className="aspect-square overflow-hidden rounded-xl bg-secondary">
                    <LettyImage
                      imageKey={m.imageKey}
                      alt={m.alt}
                      sizes="(max-width: 1024px) 45vw, 24vw"
                      className="object-cover"
                    />
                  </div>
                </Reveal>
              ))}
            </div>
          </div>

          {/* Panel */}
          <div className="lg:sticky lg:top-28">
            <Reveal>
              <div className="flex items-center justify-between gap-2">
                <p className="text-[11px] font-medium uppercase tracking-luxe text-stone">LETTY</p>
                <span className="inline-flex items-center rounded-full border border-gold/60 px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-luxe-sm text-gold">
                  Pre-Order · First Run
                </span>
              </div>
              <h3 className="mt-3 font-serif text-3xl font-medium leading-tight text-ink md:text-4xl">
                {product.name}
              </h3>
              <p className="mt-2 text-xs font-medium uppercase tracking-luxe text-gold">
                {product.tagline}
              </p>

              <div className="mt-5 flex items-baseline gap-3">
                <Price price={product.basePriceUsd} className="text-2xl" />
                <span className="text-xs uppercase tracking-luxe-sm text-stone">
                  Pre-order price
                </span>
              </div>

              <p className="mt-5 text-sm leading-relaxed text-stone">{product.description}</p>

              <ul className="mt-7 border-t border-line">
                {product.details.map((detail, i) => (
                  <li
                    key={detail}
                    className="flex items-baseline gap-4 border-b border-line py-3 text-sm text-stone"
                  >
                    <span className="font-serif text-xs text-gold">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    {detail}
                  </li>
                ))}
              </ul>

              <motion.button
                type="button"
                onClick={reserve}
                disabled={!variant || variant.stockQuantity <= 0}
                whileTap={variant?.stockQuantity ? { scale: 0.98 } : undefined}
                className={cn(
                  "mt-8 flex min-h-[54px] w-full items-center justify-center gap-3 rounded-full border border-gold/40 px-8 py-4 transition-all duration-300 select-none",
                  variant?.stockQuantity
                    ? "cursor-pointer bg-ink text-ivory shadow-[0_4px_24px_rgba(17,17,17,0.18)] hover:border-gold/70 hover:bg-[#201c18] hover:shadow-[0_8px_32px_rgba(17,17,17,0.28)]"
                    : "cursor-not-allowed border-line/70 bg-stone/15 text-stone",
                )}
              >
                <ShoppingBag className="h-4.5 w-4.5 text-ivory/90" />
                <span className="text-xs font-semibold uppercase tracking-[0.2em] sm:text-[13px]">
                  Pre-Order — Add to Bag
                </span>
                <span className="h-3.5 w-px bg-ivory/20" />
                <Price
                  price={product.basePriceUsd}
                  className="font-serif text-xs font-medium text-ivory/95 sm:text-[13px]"
                />
              </motion.button>

              <ul className="mt-6 flex flex-col gap-3 text-xs text-stone">
                <li className="flex items-center gap-3">
                  <Truck className="h-4 w-4 shrink-0" aria-hidden />
                  <span>
                    <strong>Pre-orders dispatch as soon as the first run lands</strong> — your kit
                    is reserved today.
                  </span>
                </li>
                <li className="flex items-center gap-3">
                  <Check className="h-4 w-4 shrink-0" aria-hidden />
                  <span>
                    100% <strong>secure encrypted</strong> checkout.
                  </span>
                </li>
              </ul>

              <Link
                href={`/products/${product.slug}`}
                className="mt-6 inline-block text-[11px] font-medium uppercase tracking-luxe text-stone underline-offset-4 transition hover:text-ink hover:underline"
              >
                View full details
              </Link>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ── Volumes — ink band ──────────────────────────────────────── */}
      <section aria-labelledby="volumes-heading" className="bg-ink px-6 py-16 text-ivory md:py-24">
        <div className="mx-auto max-w-6xl">
          <div className="flex flex-col items-center gap-3 text-center">
            <p className="text-xs font-medium uppercase tracking-luxe text-gold">Four Volumes</p>
            <h2
              id="volumes-heading"
              className="font-serif text-3xl font-medium uppercase tracking-[0.12em] md:text-4xl"
            >
              Choose Your Density
            </h2>
            <span aria-hidden className="rule-gold mx-auto h-px w-24" />
          </div>
          <div className="mt-12 grid grid-cols-2 gap-y-10 md:mt-16 md:grid-cols-4 md:divide-x md:divide-ivory/15">
            {VOLUMES.map((volume, i) => (
              <Reveal key={volume.d} delay={0.06 * i}>
                <div className="text-center">
                  <p className="font-serif text-4xl font-light md:text-5xl">{volume.d}</p>
                  <p className="mt-3 text-[11px] font-medium uppercase tracking-luxe text-ivory/70">
                    {volume.label}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>
          <p className="mt-12 text-center text-xs text-ivory/60 md:mt-16">
            Mixed 10–16mm lengths — every book builds a seamless gradient.
          </p>
        </div>
      </section>

      {/* ── The ritual ──────────────────────────────────────────────── */}
      <section aria-labelledby="ritual-heading" className="mx-auto max-w-7xl px-4 py-16 md:px-8 md:py-24">
        <SectionHeading
          eyebrow="The Application"
          title="The Ritual"
          description="From glue to gentle removal — the whole application lives inside the book."
        />
        <span id="ritual-heading" className="sr-only">
          How to apply and remove
        </span>
        <div className="mt-12 grid gap-10 md:grid-cols-3 md:gap-8">
          {(product.howToUseSteps ?? []).map((step, i) => (
            <Reveal key={step.title} delay={0.06 * i}>
              <div className="border-t border-line pt-6">
                <p className="font-serif text-sm text-gold">{String(i + 1).padStart(2, "0")}</p>
                <h3 className="mt-3 font-serif text-xl font-medium text-ink">{step.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-stone">{step.text}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ── Closing CTA — the artwork returns ───────────────────────── */}
      <section
        ref={closeRef}
        aria-label="Reserve the Lash Book"
        className="relative overflow-hidden"
      >
        <div className="relative h-[65vh] min-h-[420px] w-full">
          <motion.div
            aria-hidden
            className="absolute inset-[-8%] will-change-transform"
            style={{ y: reduceMotion ? 0 : closeParallaxY }}
          >
            <LettyImage
              imageKey={ctaImage}
              alt=""
              sizes="100vw"
              quality={85}
              className="object-cover object-[center_70%]"
            />
          </motion.div>
          <div aria-hidden className="absolute inset-0 bg-ink/55" />
          <div className="absolute inset-0 flex flex-col items-center justify-center px-6 text-center">
            <Reveal>
              <p className="text-[11px] font-medium uppercase tracking-luxe text-gold">
                Limited First Run
              </p>
              <p className="mt-4 font-serif text-3xl font-light italic leading-snug text-ivory md:text-5xl">
                Soft. Full. Yours.
              </p>
              <div className="mt-9 w-full max-w-[260px]">
                <LinedButton href="#reserve" tone="ivory" width="w-full">
                  Reserve Yours · {priceLabel}
                </LinedButton>
              </div>
            </Reveal>
          </div>
        </div>
      </section>
    </main>
  );
}
