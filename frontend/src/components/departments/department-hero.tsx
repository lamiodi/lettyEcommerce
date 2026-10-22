"use client";

import { useRef } from "react";
import Link from "next/link";
import {
  motion,
  useReducedMotion,
  useScroll,
  useTransform,
} from "framer-motion";
import { LettyImage } from "@/components/shared/letty-image";
import { TextMaskReveal } from "@/components/shared/text-mask-reveal";
import { LinedButton } from "@/components/shared/lined-button";
import { DURATION, heroFadeUp } from "@/lib/motion";
import { cn } from "@/lib/utils";
import type { ImageKey } from "@/lib/images";
import type { DepartmentHeroOverlay } from "@/lib/data/departments";

interface DepartmentHeroProps {
  name: string;
  tagline: string;
  ctaLabel: string;
  ctaHref: string;
  imageKey: ImageKey;
  imageClassName?: string;
  heroOverlay?: DepartmentHeroOverlay;
  heroHeightClassName?: string;
}

/**
 * Department campaign hero — full-bleed campaign image with the world's
 * name, tagline and a single CTA overlaid.
 *
 * Supports both:
 * 1. Standard departmental editorial layout (left-aligned mask-revealed headline + LinedButton).
 * 2. "mwah-luxury" bespoke editorial overlay (signature cursive script title,
 *    tracked subtitle, hairline divider, italic tagline, and luxury blush preorder badge).
 */
export function DepartmentHero({
  name,
  tagline,
  ctaLabel,
  ctaHref,
  imageKey,
  imageClassName = "object-[center_20%] md:object-[center_25%]",
  heroOverlay,
  heroHeightClassName,
}: DepartmentHeroProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const reduceMotion = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end start"],
  });
  const parallaxY = useTransform(scrollYProgress, [0, 1], ["0%", "10%"]);

  const isMwahLuxury = heroOverlay?.variant === "mwah-luxury";
  const defaultHeight = isMwahLuxury
    ? "min-h-[75svh] sm:min-h-[80svh] md:min-h-[82vh] lg:min-h-[88vh]"
    : "min-h-[90svh] md:min-h-[78vh]";
  const heightClassName = heroHeightClassName || defaultHeight;

  return (
    <section
      ref={sectionRef}
      aria-labelledby="department-heading"
      className={cn("relative flex items-end overflow-hidden bg-ink", heightClassName)}
    >
      <motion.div
        aria-hidden
        className="absolute inset-0"
        initial={{ scale: 1.08, opacity: 0.8 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: DURATION.ambient, ease: "easeOut" }}
        style={{ y: reduceMotion ? 0 : parallaxY }}
      >
        <LettyImage
          imageKey={imageKey}
          priority
          quality={85}
          sizes="100vw"
          className={`object-cover ${imageClassName}`}
        />
      </motion.div>

      {/* Atmospheric gradient overlay — bespoke deeper bottom vignette for mwah luxury overlay */}
      <div
        aria-hidden
        className={
          isMwahLuxury
            ? "absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 via-45% to-transparent"
            : "absolute inset-0 bg-gradient-to-t from-ink/70 via-ink/20 to-transparent"
        }
      />

      {isMwahLuxury ? (
        /* Bespoke Luxury Editorial Overlay (as featured in the mwah campaign) */
        <motion.div
          className="relative z-10 mx-auto flex w-full max-w-xl flex-col items-center px-6 pb-9 text-center sm:pb-11 md:pb-14"
          initial="hidden"
          animate="visible"
        >
          {/* Cursive script title: mwah */}
          <motion.div
            variants={heroFadeUp}
            custom={0.2}
            className="select-none leading-none"
          >
            <span
              className="font-script block text-[54px] font-normal leading-[0.88] lowercase tracking-normal text-[#F6DCD4] drop-shadow-[0_2px_16px_rgba(0,0,0,0.55)] sm:text-[68px] md:text-[78px]"
              style={{
                fontFamily: "var(--font-script, 'Alex Brush', 'Great Vibes', cursive)",
              }}
            >
              {heroOverlay?.scriptTitle ?? "mwah"}
            </span>
          </motion.div>

          {/* Subtitle: LIP BALM */}
          <motion.h1
            id="department-heading"
            variants={heroFadeUp}
            custom={0.35}
            className="font-sans mt-1.5 text-[11px] font-medium uppercase tracking-[0.38em] text-[#F7F3EE] drop-shadow-[0_1px_8px_rgba(0,0,0,0.5)] sm:mt-2 sm:text-xs sm:tracking-[0.44em] md:text-sm"
          >
            {heroOverlay?.subtitle ?? "LIP BALM"}
          </motion.h1>

          {/* Centered hairline separator */}
          <motion.div
            variants={heroFadeUp}
            custom={0.45}
            className="my-2.5 h-px w-10 bg-white/45 sm:my-3 sm:w-11"
            aria-hidden="true"
          />

          {/* Romantic Italic Tagline: A little love for your lips. */}
          <motion.p
            variants={heroFadeUp}
            custom={0.55}
            className="font-serif text-xs font-light italic tracking-wide text-[#EDE5DB] drop-shadow-[0_1px_6px_rgba(0,0,0,0.45)] sm:text-sm md:text-base"
          >
            {heroOverlay?.tagline ?? tagline ?? "A little love for your lips."}
          </motion.p>

          {/* Luxury Preorder Badge Button: PREORDER NOW → */}
          <motion.div
            variants={heroFadeUp}
            custom={0.68}
            className="mt-4 sm:mt-5"
          >
            <Link
              href={heroOverlay?.ctaHref ?? ctaHref ?? "/preorder"}
              className="group inline-flex items-center justify-center gap-2.5 border border-[#221A17]/35 bg-[#E8C5B8] px-7 py-2.5 text-[10px] font-medium uppercase tracking-[0.22em] text-[#221A17] shadow-[0_4px_16px_rgba(0,0,0,0.25)] transition-all duration-300 hover:bg-[#DEB4A5] hover:shadow-[0_6px_22px_rgba(0,0,0,0.35)] active:scale-[0.98] sm:px-9 sm:py-3 sm:text-xs"
            >
              <span>{heroOverlay?.ctaLabel ?? ctaLabel ?? "PREORDER NOW"}</span>
              <span
                className="font-sans text-sm tracking-normal transition-transform duration-200 group-hover:translate-x-1"
                aria-hidden="true"
              >
                {"\u2192"}
              </span>
            </Link>
          </motion.div>
        </motion.div>
      ) : (
        /* Standard Department Campaign Layout */
        <motion.div
          className="relative z-10 flex w-full max-w-2xl flex-col items-start px-6 pb-12 sm:pb-14 md:ml-10 md:pb-16 lg:ml-16"
          initial="hidden"
          animate="visible"
        >
          {tagline.trim() ? (
            <h1
              id="department-heading"
              className="font-serif text-3xl font-light uppercase leading-[1.2] tracking-[0.16em] text-ivory whitespace-pre-line sm:text-4xl sm:tracking-[0.2em] md:text-5xl lg:text-6xl"
            >
              <TextMaskReveal text={tagline} delay={0.35} />
            </h1>
          ) : (
            <h1 id="department-heading" className="sr-only">
              {name}
            </h1>
          )}

          <motion.div variants={heroFadeUp} custom={0.65} className="mt-8 sm:mt-9 w-full max-w-[240px]">
            <LinedButton href={ctaHref} tone="ivory" width="w-full">
              {ctaLabel}
            </LinedButton>
          </motion.div>
        </motion.div>
      )}
    </section>
  );
}
