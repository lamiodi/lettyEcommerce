"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import {
  motion,
  useReducedMotion,
  useScroll,
  useTransform,
} from "framer-motion";
import { LettyImage } from "@/components/shared/letty-image";
import { TextMaskReveal } from "@/components/shared/text-mask-reveal";
import {
  ENTRANCE_REVEAL_OFFSET,
  ENTRANCE_STORAGE_KEY,
} from "@/components/home/entrance-reveal";
import {
  DURATION,
  heroFadeUp,
} from "@/lib/motion";

/**
 * Template hero — full-bleed editorial portrait with a centered serif
 * wordmark, italic subtitle, short manifesto and a single dark CTA.
 *
 * Motion: cinematic entrance with a masked word-by-word headline reveal,
 * staggered fade-up supporting copy, a slow ambient zoom on the background
 * image, and scroll parallax as the section leaves the viewport.
 */
export function Hero() {
  // When the entrance reveal is playing, hold the hero entrance until the
  // curtain lifts. Timing-only (post-hydration), so SSR output is unchanged.
  const [introDelay] = useState(() => {
    try {
      return sessionStorage.getItem(ENTRANCE_STORAGE_KEY) === "1"
        ? 0
        : ENTRANCE_REVEAL_OFFSET;
    } catch {
      return ENTRANCE_REVEAL_OFFSET;
    }
  });

  // Scroll parallax — the image drifts down slower than the viewport as the
  // hero scrolls away, adding depth between hero and the next section.
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
      aria-labelledby="hero-heading"
      className="relative flex min-h-[88svh] items-end justify-center overflow-hidden bg-ink"
    >
      {/* Ambient background zoom — slow Ken Burns effect */}
      <motion.div
        aria-hidden
        className="absolute inset-0"
        initial={{ scale: 1.12, opacity: 0.7 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: DURATION.ambient, ease: "easeOut", delay: introDelay }}
        style={{ y: reduceMotion ? 0 : parallaxY }}
      >
        <LettyImage
          imageKey="heroEditorial"
          priority
          sizes="100vw"
          className="object-center"
        />
      </motion.div>
      <div aria-hidden className="absolute inset-0 bg-ink/45" />

      <motion.div
        className="relative z-10 ml-auto mr-0 flex w-full max-w-3xl flex-col items-end px-4 pb-[23vh] pt-32 text-right md:mr-12 md:pb-[21vh] lg:mr-20 lg:pb-[19vh]"
        initial="hidden"
        animate="visible"
      >
        {/* Campaign-led, the Dior way: product name → serif headline → Discover */}
        <motion.p
          variants={heroFadeUp}
          custom={introDelay + 0.35}
          className="text-xs font-medium uppercase tracking-luxe text-gold"
        >
          Golden Hour Eau de Parfum
        </motion.p>

        <h1
          id="hero-heading"
          className="mt-3 max-w-2xl font-serif text-5xl font-medium text-ivory md:text-7xl"
        >
          <TextMaskReveal
            text="The new house signature"
            delay={introDelay + 0.45}
          />
        </h1>

        <motion.p
          variants={heroFadeUp}
          custom={introDelay + 0.6}
          className="mt-3 max-w-xl font-serif text-2xl italic text-ivory/90 md:text-3xl"
        >
          Warm. Sensual. Addictive.
        </motion.p>

        <motion.div
          variants={heroFadeUp}
          custom={introDelay + 0.8}
          className="w-full mt-9 flex flex-col items-end max-w-[200px] ml-auto"
        >
          <hr className="w-full border-ivory/30" />
          <Link
            href="/products/golden-hour-eau-de-parfum"
            className="group w-full py-3 text-[11px] font-medium uppercase tracking-luxe-sm text-ivory text-center transition-colors duration-300 hover:text-white"
          >
            Discover
          </Link>
          <hr className="w-full border-ivory/30" />
        </motion.div>
      </motion.div>
    </section>
  );
}
