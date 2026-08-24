"use client";

import { useRef } from "react";
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
import type { ImageKey } from "@/lib/images";

interface DepartmentHeroProps {
  name: string;
  tagline: string;
  ctaLabel: string;
  ctaHref: string;
  imageKey: ImageKey;
}

/**
 * Department campaign hero — full-bleed campaign image with the world's
 * name, tagline and a single CTA overlaid. Mirrors the homepage hero's
 * motion language (ambient Ken Burns zoom, masked headline, scroll
 * parallax) so every world opens with the same cinematic grammar.
 */
export function DepartmentHero({
  name,
  tagline,
  ctaLabel,
  ctaHref,
  imageKey,
}: DepartmentHeroProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const reduceMotion = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end start"],
  });
  const parallaxY = useTransform(scrollYProgress, [0, 1], ["0%", "10%"]);

  return (
    <section
      ref={sectionRef}
      aria-labelledby="department-heading"
      className="relative flex min-h-[74svh] md:min-h-[78vh] items-end overflow-hidden bg-ink"
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
          sizes="100vw"
          className="object-cover object-center"
        />
      </motion.div>
      <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-ink/70 via-ink/20 to-transparent" />

      <motion.div
        className="relative z-10 flex w-full max-w-2xl flex-col items-start px-6 pb-12 sm:pb-14 md:pb-16 md:ml-10 lg:ml-16"
        initial="hidden"
        animate="visible"
      >
        <h1
          id="department-heading"
          className="font-serif font-light text-3xl sm:text-4xl md:text-5xl lg:text-6xl uppercase tracking-[0.16em] sm:tracking-[0.2em] text-ivory leading-[1.2] whitespace-pre-line"
        >
          <TextMaskReveal text={tagline || name} delay={0.35} />
        </h1>

        <motion.div variants={heroFadeUp} custom={0.65} className="mt-8 sm:mt-9 w-full max-w-[240px]">
          <LinedButton href={ctaHref} tone="ivory" width="w-full">
            {ctaLabel}
          </LinedButton>
        </motion.div>
      </motion.div>
    </section>
  );
}
