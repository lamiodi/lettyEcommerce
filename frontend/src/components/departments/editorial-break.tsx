"use client";

import { useRef } from "react";
import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { LettyImage } from "@/components/shared/letty-image";
import { Reveal } from "@/components/shared/reveal";
import type { ImageKey } from "@/lib/images";

interface EditorialBreakProps {
  imageKey: ImageKey;
  quote?: string;
}

/**
 * Full-bleed editorial pause between product sections — the same parallax
 * treatment as the homepage campaign band, with an optional serif quote
 * to carry the department's mood.
 */
export function EditorialBreak({ imageKey, quote }: EditorialBreakProps) {
  const ref = useRef<HTMLElement>(null);
  const reduceMotion = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });

  const y = useTransform(scrollYProgress, [0, 1], ["-4%", "4%"]);

  return (
    <section ref={ref} aria-label="Editorial" className="relative overflow-hidden">
      <div className="relative h-[55vh] min-h-[380px] w-full md:h-[70vh]">
        <motion.div
          className="absolute inset-[-8%] will-change-transform"
          style={{ y: reduceMotion ? 0 : y }}
        >
          <LettyImage
            imageKey={imageKey}
            sizes="100vw"
            quality={95}
            className="object-cover object-[center_25%]"
          />
        </motion.div>
        {quote && (
          <>
            <div aria-hidden className="absolute inset-0 bg-ink/35" />
            <div className="absolute inset-0 flex items-center justify-center px-6">
              <Reveal>
                <p className="max-w-2xl text-center font-serif text-2xl italic leading-snug text-ivory md:text-4xl">
                  {quote}
                </p>
              </Reveal>
            </div>
          </>
        )}
      </div>
    </section>
  );
}
