"use client";

import Link from "next/link";
import { useRef } from "react";
import { ArrowDown } from "lucide-react";
import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { LettyImage } from "@/components/shared/letty-image";
import { Reveal } from "@/components/shared/reveal";
import { DEPARTMENTS, type Department } from "@/lib/data/departments";

/**
 * Homepage "doorway" — the four worlds of LETTY as large stacked campaign
 * panels. Each panel is a full-bleed image with a slow parallax drift and
 * hover zoom, opening into its department landing page rather than a
 * plain product grid.
 */
export function WorldsDoorway() {
  return (
    <section aria-labelledby="worlds-heading" className="bg-background">
      <div className="mx-auto max-w-7xl px-4 pt-20 md:px-8 md:pt-28">
        <Reveal className="text-center">
          <p className="text-xs font-medium uppercase tracking-luxe text-gold">
            Four Worlds
          </p>
          <h2
            id="worlds-heading"
            className="mt-3 font-serif text-4xl font-medium text-ink md:text-5xl"
          >
            Enter the World of Letty
          </h2>
        </Reveal>
      </div>

      <div className="mt-14 flex flex-col gap-6 px-4 pb-20 md:px-8 md:pb-28">
        {DEPARTMENTS.map((department, i) => (
          <WorldPanel key={department.slug} department={department} index={i} />
        ))}
      </div>
    </section>
  );
}

function WorldPanel({ department, index }: { department: Department; index: number }) {
  const ref = useRef<HTMLAnchorElement>(null);
  const reduceMotion = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });
  const y = useTransform(scrollYProgress, [0, 1], ["-5%", "5%"]);

  return (
    <Reveal delay={0.05}>
      <Link
        ref={ref}
        href={`/departments/${department.slug}`}
        aria-label={`${department.name} — discover the world`}
        className="group relative block overflow-hidden bg-ink"
      >
        <div className="relative h-[62vh] min-h-[420px] w-full md:h-[78vh]">
          <motion.div
            className="absolute inset-[-9%] will-change-transform"
            style={{ y: reduceMotion ? 0 : y }}
          >
            <div className="relative h-full w-full">
              <LettyImage
                imageKey={department.heroImageKey}
                alt={department.name}
                sizes="100vw"
                className="object-center transition-transform duration-700 ease-out group-hover:scale-[1.03]"
              />
            </div>
          </motion.div>
          <div
            aria-hidden
            className="absolute inset-0 bg-gradient-to-t from-ink/75 via-ink/20 to-transparent"
          />

          <div className="absolute inset-0 flex items-end">
            <div className="flex w-full items-end justify-between gap-6 p-6 md:p-12">
              <div className="flex flex-col items-start gap-2">
                <p className="text-xs font-medium uppercase tracking-luxe text-gold">
                  {String(index + 1).padStart(2, "0")}
                </p>
                <h3 className="font-serif text-3xl font-medium uppercase tracking-luxe text-ivory md:text-5xl">
                  {department.name}
                </h3>
                <p className="font-serif text-lg italic text-ivory/85 md:text-xl">
                  {department.tagline}
                </p>
              </div>
              <span
                aria-hidden
                className="mb-1 hidden h-12 w-12 shrink-0 items-center justify-center rounded-full border border-ivory/40 text-ivory transition-all duration-300 group-hover:border-ivory group-hover:bg-ivory group-hover:text-ink sm:inline-flex"
              >
                <ArrowDown className="h-4 w-4 transition-transform duration-300 group-hover:translate-y-0.5" />
              </span>
            </div>
          </div>
        </div>
      </Link>
    </Reveal>
  );
}
