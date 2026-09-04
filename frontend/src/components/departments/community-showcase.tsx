"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";

interface CommunityShowcaseProps {
  title?: string;
  topCard?: {
    image: string;
    ctaLabel: string;
    ctaHref: string;
  };
  bottomCard?: {
    image: string;
    ctaLabel: string;
    ctaHref: string;
    domain?: string;
  };
}

/**
 * Mobile-first "OUR COMMUNITY" showcase inspired by luxury beauty community edits.
 * Features a bold header, a VIP model portrait with a glowing hot-pink CTA pill,
 * and a 3-creator ambassador triptych with a stacked domain badge.
 */
export function CommunityShowcase({
  title = "OUR COMMUNITY",
  topCard = {
    image: "/IMG_6270.PNG",
    ctaLabel: "JOIN LETTY'S VIPS",
    ctaHref: "/contact?vip=true",
  },
  bottomCard = {
    image: "/images/letty_community_ambassadors.jpg",
    ctaLabel: "JOIN AMBASSADORS",
    ctaHref: "/contact?ambassador=true",
    domain: "lettybeautyofficial",
  },
}: CommunityShowcaseProps) {
  return (
    <section
      aria-label="Letty Beauty Community"
      className="w-full bg-ivory py-10 px-4 sm:py-16 sm:px-6 md:px-8"
    >
      <div className="mx-auto max-w-md sm:max-w-lg">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mb-6 text-center"
        >
          <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-[#DE1B76] drop-shadow-xs font-sans">
            {title}
          </h2>
        </motion.div>

        <div className="flex flex-col gap-6 sm:gap-7">
          {/* Card 1: Top Hero VIP Card */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="group relative aspect-[4/5] w-full overflow-hidden rounded-[26px] sm:rounded-[32px] bg-secondary shadow-md ring-1 ring-black/5"
          >
            <Image
              src={topCard.image}
              alt="Letty Beauty VIP Community"
              fill
              sizes="(max-width: 640px) 100vw, 520px"
              priority
              className="object-cover object-[center_35%] transition-transform duration-700 ease-out group-hover:scale-[1.03]"
            />

            {/* Subtle soft gradient at the bottom for high CTA contrast */}
            <div
              aria-hidden
              className="absolute inset-x-0 bottom-0 h-36 bg-gradient-to-t from-black/50 via-black/20 to-transparent pointer-events-none"
            />

            {/* Pinned Bottom CTA Button */}
            <div className="absolute inset-x-0 bottom-5 sm:bottom-6 flex justify-center z-10 px-4">
              <Link
                href={topCard.ctaHref}
                className="inline-flex items-center justify-center rounded-full bg-[#DE1B76] px-7 sm:px-9 py-3 text-xs sm:text-sm font-extrabold uppercase tracking-wider text-white shadow-[0_8px_20px_rgba(222,27,118,0.35)] transition-all duration-300 hover:bg-[#C2185B] hover:scale-105 active:scale-95"
              >
                {topCard.ctaLabel}
              </Link>
            </div>
          </motion.div>

          {/* Card 2: Bottom Ambassadors Triptych Card */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="group relative aspect-[4/5] w-full overflow-hidden rounded-[26px] sm:rounded-[32px] bg-secondary shadow-md ring-1 ring-black/5"
          >
            <Image
              src={bottomCard.image}
              alt="Letty Beauty Ambassadors"
              fill
              sizes="(max-width: 640px) 100vw, 520px"
              className="object-cover object-center transition-transform duration-700 ease-out group-hover:scale-[1.03]"
            />

            {/* Subtle soft gradient at the bottom for CTA contrast */}
            <div
              aria-hidden
              className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-black/60 via-black/25 to-transparent pointer-events-none"
            />

            {/* Pinned Bottom CTA Stacked Pill */}
            <div className="absolute inset-x-0 bottom-4 sm:bottom-5 flex flex-col items-center justify-center z-10 px-4">
              <Link
                href={bottomCard.ctaHref}
                className="z-20 inline-flex items-center justify-center rounded-full bg-[#DE1B76] px-6 sm:px-8 py-2.5 text-xs sm:text-sm font-extrabold uppercase tracking-wider text-white shadow-[0_6px_18px_rgba(222,27,118,0.4)] transition-all duration-300 hover:bg-[#C2185B] hover:scale-105 active:scale-95"
              >
                {bottomCard.ctaLabel}
              </Link>

              {bottomCard.domain && (
                <div className="z-10 -mt-2.5 w-44 sm:w-52 rounded-b-2xl bg-black/85 px-3 pt-3.5 pb-1.5 text-center shadow-md backdrop-blur-xs">
                  <span className="text-[10px] sm:text-[11px] font-semibold tracking-wide text-white/95">
                    {bottomCard.domain}
                  </span>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
