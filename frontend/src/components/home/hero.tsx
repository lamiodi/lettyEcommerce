"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { LettyImage } from "@/components/shared/letty-image";

const ease = [0.22, 1, 0.36, 1] as const;

/**
 * Template hero — full-bleed editorial portrait with a centered serif
 * wordmark, italic subtitle, short manifesto and a single dark CTA.
 */
export function Hero() {
  return (
    <section
      aria-labelledby="hero-heading"
      className="relative flex min-h-[88svh] items-end justify-center overflow-hidden bg-ink"
    >
      <motion.div
        aria-hidden
        className="absolute inset-0"
        initial={{ scale: 1.12 }}
        animate={{ scale: 1 }}
        transition={{ duration: 7, ease: "easeOut" }}
      >
        <LettyImage
          imageKey="heroEditorial"
          priority
          sizes="100vw"
          className="object-center"
        />
      </motion.div>
      <div aria-hidden className="absolute inset-0 bg-ink/45" />

      <div className="relative z-10 ml-auto mr-0 flex w-full max-w-3xl flex-col items-end px-4 pb-[23vh] pt-32 text-right md:mr-12 md:pb-[21vh] lg:mr-20 lg:pb-[19vh]">
        <motion.h1
          id="hero-heading"
          initial={{ opacity: 0, y: 32 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.35, ease }}
          className="font-serif text-6xl font-medium uppercase tracking-luxe text-ivory md:text-8xl"
        >
          Letty
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.5, ease }}
          className="mt-2 font-serif text-2xl italic text-ivory/90 md:text-3xl"
        >
          luxury beauty atelier
        </motion.p>

        <motion.p
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.65, ease }}
          className="mt-6 max-w-md text-sm leading-relaxed text-ivory/85 md:text-base"
        >
          Hair rituals, fragrance wardrobes and couture cosmetics curated
          from the world&apos;s quietest ateliers and delivered to your door.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.8, ease }}
          className="w-full mt-9 flex flex-col items-end max-w-[200px] ml-auto"
        >
          <hr className="w-full border-ivory/30" />
          <Link
            href="/shop"
            className="w-full py-3 text-[11px] font-medium uppercase tracking-luxe-sm text-ivory transition-colors hover:text-white text-center"
          >
            Shop the Edit
          </Link>
          <hr className="w-full border-ivory/30" />
        </motion.div>
      </div>
    </section>
  );
}
