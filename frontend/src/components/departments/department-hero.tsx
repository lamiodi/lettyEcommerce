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
  const parallaxY = useTransform(scrollYProgress, [0, 1], ["0%", "12%"]);

  return (
    <section
      ref={sectionRef}
      aria-labelledby="department-heading"
      className="relative flex min-h-[88svh] items-end overflow-hidden bg-ink"
    >
      <motion.div
        aria-hidden
        className="absolute inset-0"
        initial={{ scale: 1.12, opacity: 0.7 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: DURATION.ambient, ease: "easeOut" }}
        style={{ y: reduceMotion ? 0 : parallaxY }}
      >
        <LettyImage
          imageKey={imageKey}
          priority
          sizes="100vw"
          className="object-center"
        />
      </motion.div>
      <div aria-hidden className="absolute inset-0 bg-ink/45" />

      <motion.div
        className="relative z-10 flex w-full max-w-3xl flex-col items-start px-4 pb-[20vh] pt-32 md:ml-12 lg:ml-20"
        initial="hidden"
        animate="visible"
      >
        <motion.p
          variants={heroFadeUp}
          custom={0.35}
          className="text-xs font-medium uppercase tracking-luxe text-gold"
        >
          The World of Letty
        </motion.p>

        <h1
          id="department-heading"
          className="mt-3 font-serif text-4xl font-medium uppercase tracking-luxe text-ivory md:text-6xl"
        >
          <TextMaskReveal text={name} delay={0.45} />
        </h1>

        <motion.p
          variants={heroFadeUp}
          custom={0.6}
          className="mt-3 font-serif text-2xl italic text-ivory/90 md:text-3xl"
        >
          {tagline}
        </motion.p>

        <motion.div variants={heroFadeUp} custom={0.8} className="mt-9">
          <LinedButton href={ctaHref} tone="ivory" width="max-w-[260px]">
            {ctaLabel}
          </LinedButton>
        </motion.div>
      </motion.div>
    </section>
  );
}
