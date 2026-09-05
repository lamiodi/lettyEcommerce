"use client";

import Image from "next/image";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowUpRight, Check, Sparkles } from "lucide-react";
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
    image: "/IMG_6270.PNG",
    ctaLabel: "JOIN LETTY'S VIPS",
    ctaHref: "/contact?vip=true",
    badge: "VIP Club",
    description:
      "An invitation-only sanctuary for our most devoted patrons. Experience confidential allocations, bespoke concierge gifting, and secret archive access.",
    perks: "Private drops · Concierge gifts · Secret access",
  },
  bottomCard = {
    image: "/images/letty_community_ambassadors.jpg",
    ctaLabel: "JOIN AMBASSADORS",
    ctaHref: "/contact?ambassador=true",
    domain: "lettybeautyofficial",
    badge: "Creator Edit",
    description:
      "Partner with LETTY as a global beauty storyteller. Share our artisanal formulas with your audience and receive seasonal gifting suites.",
    perks: "PR gifting · Tiered commission · Global features",
  },
}: CommunityShowcaseProps) {
  const reduceMotion = useReducedMotion();

  // Curated privilege chips
  const vipChips = topCard.perks
    ? topCard.perks.split("·").map((p) => p.trim()).filter(Boolean)
    : ["Private Drops", "Concierge Gifts", "Secret Access"];

  const ambassadorChips = bottomCard.perks
    ? bottomCard.perks.split("·").map((p) => p.trim()).filter(Boolean)
    : ["PR Gifting Suites", "Tiered Commission", "Global Features"];

  return (
    <section
      aria-label="Letty Beauty Community"
      className="relative w-full bg-ivory py-16 px-4 sm:py-20 sm:px-6 md:px-8 lg:py-28 lg:px-12 xl:px-16 overflow-hidden"
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
          className="mb-12 lg:mb-16 text-center max-w-4xl mx-auto"
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
            className="group relative aspect-[4/5] sm:aspect-[3/4] lg:aspect-[4/5] min-h-[560px] sm:min-h-[600px] lg:min-h-[640px] w-full overflow-hidden rounded-[28px] sm:rounded-[34px] bg-ink shadow-lg ring-1 ring-ink/10 transition-all duration-700 hover:shadow-2xl hover:ring-gold/35"
          >
            <Image
              src={topCard.image}
              alt="Letty Beauty VIP Inner Circle"
              fill
              sizes="(max-width: 1023px) 100vw, 50vw"
              priority
              className="object-cover object-[center_28%] transition-transform duration-700 ease-out group-hover:scale-[1.03]"
            />

            {/* Layered Luxury Scrims */}
            <div
              aria-hidden
              className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-ink/75 via-ink/30 to-transparent pointer-events-none"
            />
            <div
              aria-hidden
              className="absolute inset-x-0 bottom-0 h-3/5 bg-gradient-to-t from-ink via-ink/70 to-transparent pointer-events-none"
            />

            {/* Top Bar: Glassmorphic VIP Badge */}
            <div className="absolute top-5 left-5 sm:top-6 sm:left-6 z-10">
              <span className="inline-flex items-center gap-2 rounded-full bg-ink/50 backdrop-blur-md px-4 py-1.5 text-[11px] font-medium uppercase tracking-luxe text-ivory ring-1 ring-white/20 shadow-xs">
                <span className="h-1.5 w-1.5 rounded-full bg-gold shadow-[0_0_8px_rgba(169,138,95,0.9)] animate-pulse" />
                {topCard.badge ?? "VIP Club"}
              </span>
            </div>

            {/* Bottom Content & Interactive CTA */}
            <div className="absolute inset-x-0 bottom-6 sm:bottom-8 lg:bottom-10 z-10 px-6 sm:px-8 flex flex-col items-center text-center">
              <span className="text-[11px] font-medium uppercase tracking-luxe text-gold/90 mb-1.5">
                The Discerning Patron
              </span>
              <h3 className="font-serif text-2xl sm:text-3xl lg:text-[2rem] text-ivory font-normal tracking-wide mb-2.5">
                VIP Sanctuary
              </h3>
              <p className="max-w-md text-xs sm:text-sm text-ivory/80 font-light leading-relaxed mb-5">
                {topCard.description ??
                  "An invitation-only sanctuary for our most devoted patrons. Experience confidential allocations, bespoke concierge gifting, and secret archive access."}
              </p>

              {/* Scannable Privilege Chips */}
              <div className="flex flex-wrap items-center justify-center gap-2 mb-6">
                {vipChips.map((perk, index) => (
                  <span
                    key={`vip-perk-${index}`}
                    className="inline-flex items-center gap-1.5 rounded-full bg-white/10 backdrop-blur-md px-3.5 py-1 text-[11px] font-medium uppercase tracking-wider text-ivory/95 ring-1 ring-white/15 shadow-2xs"
                  >
                    <Sparkles className="h-2.5 w-2.5 text-gold" />
                    {perk}
                  </span>
                ))}
              </div>

              {/* Tactile Ivory CTA Button */}
              <Link
                href={topCard.ctaHref}
                className="group/btn inline-flex items-center justify-center gap-2 rounded-full bg-ivory px-8 sm:px-10 py-3.5 sm:py-4 text-xs sm:text-sm font-semibold uppercase tracking-luxe text-ink shadow-[0_8px_25px_rgba(0,0,0,0.35)] transition-all duration-300 hover:bg-white hover:text-ink hover:shadow-[0_12px_32px_rgba(169,138,95,0.35)] hover:-translate-y-0.5 active:translate-y-0"
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
            className="group relative aspect-[4/5] sm:aspect-[3/4] lg:aspect-[4/5] min-h-[560px] sm:min-h-[600px] lg:min-h-[640px] w-full overflow-hidden rounded-[28px] sm:rounded-[34px] bg-ink shadow-lg ring-1 ring-ink/10 transition-all duration-700 hover:shadow-2xl hover:ring-gold/35"
          >
            <Image
              src={bottomCard.image}
              alt="Letty Beauty Global Ambassadors"
              fill
              sizes="(max-width: 1023px) 100vw, 50vw"
              className="object-cover object-center transition-transform duration-700 ease-out group-hover:scale-[1.03]"
            />

            {/* Layered Luxury Scrims */}
            <div
              aria-hidden
              className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-ink/75 via-ink/30 to-transparent pointer-events-none"
            />
            <div
              aria-hidden
              className="absolute inset-x-0 bottom-0 h-3/5 bg-gradient-to-t from-ink via-ink/70 to-transparent pointer-events-none"
            />

            {/* Top Bar: Creator Badge & Integrated Social Handle */}
            <div className="absolute top-5 left-5 right-5 sm:top-6 sm:left-6 sm:right-6 z-10 flex items-center justify-between">
              <span className="inline-flex items-center gap-2 rounded-full bg-ink/50 backdrop-blur-md px-4 py-1.5 text-[11px] font-medium uppercase tracking-luxe text-ivory ring-1 ring-white/20 shadow-xs">
                <span className="h-1.5 w-1.5 rounded-full bg-gold shadow-[0_0_8px_rgba(169,138,95,0.9)]" />
                {bottomCard.badge ?? "Creator Edit"}
              </span>

              {bottomCard.domain && (
                <a
                  href={`https://instagram.com/${bottomCard.domain.replace("@", "")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md px-3.5 py-1.5 text-[11px] font-medium tracking-wider text-ivory ring-1 ring-white/20 transition-colors duration-300"
                  title="Follow Letty Beauty on Instagram"
                >
                  <svg
                    className="h-3.5 w-3.5 fill-current text-gold"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                  </svg>
                  <span>@{bottomCard.domain.replace("@", "")}</span>
                </a>
              )}
            </div>

            {/* Bottom Content & Interactive CTA */}
            <div className="absolute inset-x-0 bottom-6 sm:bottom-8 lg:bottom-10 z-10 px-6 sm:px-8 flex flex-col items-center text-center">
              <span className="text-[11px] font-medium uppercase tracking-luxe text-gold/90 mb-1.5">
                The Storyteller Edit
              </span>
              <h3 className="font-serif text-2xl sm:text-3xl lg:text-[2rem] text-ivory font-normal tracking-wide mb-2.5">
                Ambassador Atelier
              </h3>
              <p className="max-w-md text-xs sm:text-sm text-ivory/80 font-light leading-relaxed mb-5">
                {bottomCard.description ??
                  "Partner with LETTY as a global beauty storyteller. Share our artisanal formulas with your audience and receive seasonal gifting suites."}
              </p>

              {/* Scannable Privilege Chips */}
              <div className="flex flex-wrap items-center justify-center gap-2 mb-6">
                {ambassadorChips.map((perk, index) => (
                  <span
                    key={`ambassador-perk-${index}`}
                    className="inline-flex items-center gap-1.5 rounded-full bg-white/10 backdrop-blur-md px-3.5 py-1 text-[11px] font-medium uppercase tracking-wider text-ivory/95 ring-1 ring-white/15 shadow-2xs"
                  >
                    <Check className="h-2.5 w-2.5 text-gold" />
                    {perk}
                  </span>
                ))}
              </div>

              {/* Tactile Gold CTA Button */}
              <Link
                href={bottomCard.ctaHref}
                className="group/btn inline-flex items-center justify-center gap-2 rounded-full bg-gold px-8 sm:px-10 py-3.5 sm:py-4 text-xs sm:text-sm font-semibold uppercase tracking-luxe text-ink shadow-[0_8px_25px_rgba(169,138,95,0.3)] transition-all duration-300 hover:bg-[#bfa073] hover:text-ink hover:shadow-[0_12px_32px_rgba(169,138,95,0.45)] hover:-translate-y-0.5 active:translate-y-0"
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

