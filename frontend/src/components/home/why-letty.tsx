"use client";

import { motion } from "framer-motion";
import { Reveal } from "@/components/shared/reveal";
import { TextMaskReveal } from "@/components/shared/text-mask-reveal";
import { staggerChild, staggerContainer } from "@/lib/motion";

const PILLARS = [
  "Botanical formulations",
  "Luxury craftsmanship",
  "Thoughtfully curated collections",
  "Designed for everyday rituals",
];

/**
 * "Why LETTY" section — brand pillars with staggered reveal.
 */
export function WhyLetty() {
  return (
    <section className="bg-ivory py-16 text-center border-y border-line">
      <Reveal>
        <h2 className="font-serif text-2xl font-medium text-ink">
          <TextMaskReveal text="Why LETTY" />
        </h2>
      </Reveal>
      <motion.div
        className="mx-auto mt-8 flex max-w-4xl flex-wrap justify-center gap-8 px-4 text-sm text-stone md:gap-16"
        variants={staggerContainer}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-60px" }}
      >
        {PILLARS.map((pillar) => (
          <motion.p key={pillar} variants={staggerChild}>
            {pillar}
          </motion.p>
        ))}
      </motion.div>
    </section>
  );
}
