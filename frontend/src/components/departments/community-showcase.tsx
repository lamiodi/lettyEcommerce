"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";

interface CommunityShowcaseProps {
  title?: string;
  subtitle?: string;
  topCard?: {
    image: string;
    ctaLabel: string;
    ctaHref: string;
    badge?: string;
    perks?: string;
  };
  bottomCard?: {
    image: string;
    ctaLabel: string;
    ctaHref: string;
    domain?: string;
    badge?: string;
    perks?: string;
  };
}

/**
 * Editorial "OUR COMMUNITY" showcase.
 * - Mobile: streamlined vertical stacked view.
 * - LG Screen Devices: expanded luxury 2-column magazine layout with badges,
 *   richer typography, and enhanced hover micro-interactions.
 */
export function CommunityShowcase({
  title = "OUR COMMUNITY",
  subtitle = "Step inside the world of LETTY. Unlock inner-circle VIP privileges or partner with us as a global beauty ambassador.",
  topCard = {
    image: "/IMG_6270.PNG",
    ctaLabel: "JOIN LETTY'S VIPS",
    ctaHref: "/contact?vip=true",
    badge: "VIP Club",
    perks: "Private drops · Concierge gifts · Secret access",
  },
  bottomCard = {
    image: "/images/letty_community_ambassadors.jpg",
    ctaLabel: "JOIN AMBASSADORS",
    ctaHref: "/contact?ambassador=true",
    domain: "lettybeautyofficial",
    badge: "Creator Edit",
    perks: "PR gifting · Tiered commission · Global features",
  },
}: CommunityShowcaseProps) {
  return (
    <section
      aria-label="Letty Beauty Community"
      className="w-full bg-ivory py-12 px-4 sm:py-16 sm:px-6 md:px-8 lg:py-20 lg:px-12 xl:px-16 overflow-hidden"
    >
      <div className="mx-auto max-w-md sm:max-w-lg lg:max-w-6xl xl:max-w-7xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mb-8 lg:mb-12 text-center"
        >
          <p className="text-[11px] sm:text-xs uppercase tracking-[0.25em] font-bold text-[#DE1B76]/90 mb-2">
            The Inner Circle & Creators
          </p>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-black uppercase tracking-tight text-[#DE1B76] drop-shadow-xs font-sans">
            {title}
          </h2>
          {subtitle && (
            <p className="mt-2.5 sm:mt-3 max-w-xl mx-auto text-xs sm:text-sm text-muted-foreground/90 font-normal leading-relaxed">
              {subtitle}
            </p>
          )}
        </motion.div>

        {/* Cards Grid: Mobile (1 column stacked) -> LG (2 columns side-by-side) */}
        <div className="flex flex-col gap-6 sm:gap-7 lg:grid lg:grid-cols-2 lg:gap-8 xl:gap-10">
          {/* Card 1: VIP Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="group relative aspect-[4/5] lg:aspect-[3/4] xl:aspect-[4/5] lg:min-h-[580px] w-full overflow-hidden rounded-[26px] sm:rounded-[32px] lg:rounded-[36px] bg-secondary shadow-md hover:shadow-xl transition-all duration-500 ring-1 ring-black/5"
          >
            <Image
              src={topCard.image}
              alt="Letty Beauty VIP Community"
              fill
              sizes="(max-width: 1023px) 100vw, 50vw"
              priority
              className="object-cover object-[center_30%] transition-transform duration-700 ease-out group-hover:scale-[1.04]"
            />

            {/* Top Glassmorphic Badge */}
            <div className="absolute top-4 left-4 sm:top-6 sm:left-6 z-10">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-black/45 backdrop-blur-md px-3.5 py-1.5 text-[11px] font-bold uppercase tracking-wider text-white ring-1 ring-white/20 shadow-xs">
                <span className="h-1.5 w-1.5 rounded-full bg-[#DE1B76] animate-pulse" />
                {topCard.badge ?? "VIP Club"}
              </span>
            </div>

            {/* Bottom Gradient Overlay for high contrast */}
            <div
              aria-hidden
              className="absolute inset-x-0 bottom-0 h-44 sm:h-48 lg:h-52 bg-gradient-to-t from-black/80 via-black/35 to-transparent pointer-events-none"
            />

            {/* Pinned Bottom Content & CTA Button */}
            <div className="absolute inset-x-0 bottom-6 sm:bottom-7 lg:bottom-8 flex flex-col items-center justify-end z-10 px-5 text-center">
              {topCard.perks && (
                <p className="mb-3.5 hidden sm:block text-[11px] sm:text-xs font-medium tracking-wide text-white/90 drop-shadow-xs">
                  {topCard.perks}
                </p>
              )}
              <Link
                href={topCard.ctaHref}
                className="inline-flex items-center justify-center rounded-full bg-[#DE1B76] px-8 sm:px-10 py-3 sm:py-3.5 text-xs sm:text-sm font-extrabold uppercase tracking-wider text-white shadow-[0_8px_25px_rgba(222,27,118,0.4)] transition-all duration-300 hover:bg-[#C2185B] hover:shadow-[0_12px_32px_rgba(222,27,118,0.55)] hover:-translate-y-0.5 active:translate-y-0 active:scale-95"
              >
                {topCard.ctaLabel}
              </Link>
            </div>
          </motion.div>

          {/* Card 2: Ambassadors Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="group relative aspect-[4/5] lg:aspect-[3/4] xl:aspect-[4/5] lg:min-h-[580px] w-full overflow-hidden rounded-[26px] sm:rounded-[32px] lg:rounded-[36px] bg-secondary shadow-md hover:shadow-xl transition-all duration-500 ring-1 ring-black/5"
          >
            <Image
              src={bottomCard.image}
              alt="Letty Beauty Ambassadors"
              fill
              sizes="(max-width: 1023px) 100vw, 50vw"
              className="object-cover object-center transition-transform duration-700 ease-out group-hover:scale-[1.04]"
            />

            {/* Top Glassmorphic Badge */}
            <div className="absolute top-4 left-4 sm:top-6 sm:left-6 z-10">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-black/45 backdrop-blur-md px-3.5 py-1.5 text-[11px] font-bold uppercase tracking-wider text-white ring-1 ring-white/20 shadow-xs">
                <span className="h-1.5 w-1.5 rounded-full bg-[#DE1B76]" />
                {bottomCard.badge ?? "Creator Edit"}
              </span>
            </div>

            {/* Bottom Gradient Overlay */}
            <div
              aria-hidden
              className="absolute inset-x-0 bottom-0 h-44 sm:h-48 lg:h-52 bg-gradient-to-t from-black/85 via-black/40 to-transparent pointer-events-none"
            />

            {/* Pinned Bottom Stacked CTA & Domain Pill */}
            <div className="absolute inset-x-0 bottom-5 sm:bottom-6 lg:bottom-7 flex flex-col items-center justify-end z-10 px-5 text-center">
              {bottomCard.perks && (
                <p className="mb-3.5 hidden sm:block text-[11px] sm:text-xs font-medium tracking-wide text-white/90 drop-shadow-xs">
                  {bottomCard.perks}
                </p>
              )}
              <div className="flex flex-col items-center justify-center">
                <Link
                  href={bottomCard.ctaHref}
                  className="z-20 inline-flex items-center justify-center rounded-full bg-[#DE1B76] px-8 sm:px-10 py-3 sm:py-3.5 text-xs sm:text-sm font-extrabold uppercase tracking-wider text-white shadow-[0_8px_25px_rgba(222,27,118,0.45)] transition-all duration-300 hover:bg-[#C2185B] hover:shadow-[0_12px_32px_rgba(222,27,118,0.55)] hover:-translate-y-0.5 active:translate-y-0 active:scale-95"
                >
                  {bottomCard.ctaLabel}
                </Link>

                {bottomCard.domain && (
                  <div className="z-10 -mt-2.5 w-48 sm:w-56 rounded-b-2xl bg-black/90 px-3.5 pt-3.5 pb-1.5 text-center shadow-md backdrop-blur-sm ring-1 ring-white/10">
                    <span className="text-[10px] sm:text-[11px] font-semibold tracking-wider text-white/95">
                      {bottomCard.domain}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
