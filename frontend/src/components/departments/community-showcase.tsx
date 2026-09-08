"use client";

import Image from "next/image";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";
import { EASE_LUXURY } from "@/lib/motion";

interface CommunityShowcaseProps {
  title?: string;
  subtitle?: string;
  topCard?: {
    image: string;
    ctaLabel: string;
    ctaHref: string;
    badge?: string;
    perks?: string;
    description?: string;
  };
  bottomCard?: {
    image: string;
    ctaLabel: string;
    ctaHref: string;
    domain?: string;
    badge?: string;
    perks?: string;
    description?: string;
  };
}

/**
 * Editorial "THE INNER CIRCLE & CREATORS" community showcase.
 *
 * Implements TasteSkill standards and the LETTY quiet luxury design system:
 * - Palette: Warm ivory canvas, deep espresso ink, antique bronze gold.
 * - Typography: Aboreto serif titles, Tenor Sans body with luxury tracking.
 * - Architecture: Gapless 2-column magazine bento with dual-layer depth scrims.
 * - Micro-interactions: Smooth image zoom, glassmorphic chips, tactile CTA buttons.
 */
export function CommunityShowcase({
  title = "OUR COMMUNITY",
  subtitle = "Step inside the world of LETTY. Unlock inner-circle VIP privileges or partner with us as a global beauty ambassador.",
  topCard = {
    image: "/ima/IMG_6999.PNG",
    ctaLabel: "JOIN LETTY'S VIPS",
    ctaHref: "/vip",
    badge: "VIP Sanctuary",
  },
  bottomCard = {
    image: "/ima/IMG_7017.JPG (1).jpeg",
    ctaLabel: "JOIN AMBASSADORS",
    ctaHref: "/ambassadors",
    domain: "lettybeautyofficial",
    badge: "Creator Atelier",
  },
}: CommunityShowcaseProps) {
  const reduceMotion = useReducedMotion();

  return (
    <section
      aria-label="Letty Beauty Community"
      className="relative w-full bg-ivory py-12 px-4 sm:py-16 sm:px-6 md:px-8 lg:py-20 lg:px-12 xl:px-16 overflow-hidden"
    >
      {/* Subtle Ambient Radial Warmth */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_45%_at_50%_0%,rgba(169,138,95,0.08),transparent_70%)]"
      />

      <div className="relative mx-auto max-w-md sm:max-w-xl lg:max-w-6xl xl:max-w-7xl">
        {/* Header with Luxury Typographic Hierarchy */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6, ease: EASE_LUXURY }}
          className="mb-10 lg:mb-12 text-center max-w-4xl mx-auto"
        >
          <p className="text-xs font-medium uppercase tracking-luxe text-gold mb-3">
            The Inner Circle &amp; Creators
          </p>
          <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-medium uppercase tracking-[0.14em] text-ink">
            {title}
          </h2>
          <span aria-hidden className="rule-gold mx-auto my-4 block h-px w-24" />
          {subtitle && (
            <p className="mt-3 max-w-xl mx-auto text-xs sm:text-sm text-stone font-normal leading-relaxed">
              {subtitle}
            </p>
          )}
        </motion.div>

        {/* Gapless Bento Grid: Mobile stacked -> LG 2-column luxury spread */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-10 xl:gap-12 grid-flow-dense">
          {/* Card 1: VIP Club Sanctuary */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.65, ease: EASE_LUXURY }}
            className="group relative aspect-[1/1.05] sm:aspect-[1/1.05] lg:aspect-[8/7.35] min-h-[432px] sm:min-h-[441px] lg:min-h-[470px] max-h-[495px] sm:max-h-[475px] w-full overflow-hidden rounded-[24px] sm:rounded-[30px] bg-ink shadow-lg ring-1 ring-ink/10 transition-all duration-700 hover:shadow-2xl hover:ring-gold/35"
          >
            <Image
              src={topCard.image}
              alt="Letty Beauty VIP Inner Circle"
              fill
              sizes="(max-width: 1023px) 100vw, 50vw"
              priority
              className="object-cover object-[center_25%] transition-transform duration-700 ease-out group-hover:scale-[1.03]"
            />

            {/* Soft Bottom Scrim for Button Contrast */}
            <div
              aria-hidden
              className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-ink/75 via-ink/25 to-transparent pointer-events-none"
            />

            {/* Interactive CTA */}
            <div className="absolute inset-x-0 bottom-6 sm:bottom-7 lg:bottom-8 z-10 px-5 sm:px-6 lg:px-8 flex justify-center">
              {/* Tactile Ivory CTA Button */}
              <Link
                href={topCard.ctaHref}
                className="group/btn inline-flex items-center justify-center gap-2 rounded-full bg-ivory px-7 sm:px-8 py-2.5 sm:py-3 text-xs sm:text-[13px] font-semibold uppercase tracking-luxe text-ink shadow-[0_8px_25px_rgba(0,0,0,0.35)] transition-all duration-300 hover:bg-white hover:text-ink hover:shadow-[0_12px_32px_rgba(169,138,95,0.35)] hover:-translate-y-0.5 active:translate-y-0"
              >
                <span>{topCard.ctaLabel}</span>
                <ArrowUpRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5" />
              </Link>
            </div>
          </motion.div>

          {/* Card 2: Global Ambassadors & Creators */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.65, delay: reduceMotion ? 0 : 0.1, ease: EASE_LUXURY }}
            className="group relative aspect-[1/1.05] sm:aspect-[1/1.05] lg:aspect-[8/7.35] min-h-[432px] sm:min-h-[441px] lg:min-h-[470px] max-h-[495px] sm:max-h-[475px] w-full overflow-hidden rounded-[24px] sm:rounded-[30px] bg-ink shadow-lg ring-1 ring-ink/10 transition-all duration-700 hover:shadow-2xl hover:ring-gold/35"
          >
            <Image
              src={bottomCard.image}
              alt="Letty Beauty Global Ambassadors"
              fill
              sizes="(max-width: 1023px) 100vw, 50vw"
              className="object-cover object-center transition-transform duration-700 ease-out group-hover:scale-[1.03]"
            />

            {/* Soft Bottom Scrim for Button Contrast */}
            <div
              aria-hidden
              className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-ink/75 via-ink/25 to-transparent pointer-events-none"
            />

            {/* Interactive CTA */}
            <div className="absolute inset-x-0 bottom-6 sm:bottom-7 lg:bottom-8 z-10 px-5 sm:px-6 lg:px-8 flex justify-center">
              {/* Tactile Gold CTA Button */}
              <Link
                href={bottomCard.ctaHref}
                className="group/btn inline-flex items-center justify-center gap-2 rounded-full bg-gold px-7 sm:px-8 py-2.5 sm:py-3 text-xs sm:text-[13px] font-semibold uppercase tracking-luxe text-ink shadow-[0_8px_25px_rgba(169,138,95,0.3)] transition-all duration-300 hover:bg-[#bfa073] hover:text-ink hover:shadow-[0_12px_32px_rgba(169,138,95,0.45)] hover:-translate-y-0.5 active:translate-y-0"
              >
                <span>{bottomCard.ctaLabel}</span>
                <ArrowUpRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5" />
              </Link>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

