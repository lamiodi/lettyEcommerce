"use client";

import { motion } from "framer-motion";
import { LettyImage } from "@/components/shared/letty-image";
import { LinedButton } from "@/components/shared/lined-button";
import { Reveal } from "@/components/shared/reveal";
import { staggerContainer, staggerChild } from "@/lib/motion";

const TIMELINE = [
  {
    year: "2018",
    title: "The Parisian Genesis",
    description:
      "Formed in a boutique laboratory on Rue Saint-Honoré, blending botanical elixirs for private clientele seeking silicon-free, high-performance hair care.",
  },
  {
    year: "2020",
    title: "The Grasse Fragrance House",
    description:
      "Partnered with master perfumers in Grasse to develop our signature botanical aroma profiles — combining wild lavender, amber, and bergamot.",
  },
  {
    year: "2023",
    title: "Global Flagship Outposts",
    description:
      "Expanded concierge ateliers to London (Bond Street) and New York (Madison Avenue), introducing bespoke consultation services.",
  },
  {
    year: "2026",
    title: "100% Circular Luxury Initiative",
    description:
      "Achieved fully refillable glass packaging and carbon-neutral distribution across all European & North American orders.",
  },
];

export function StoryContent() {
  return (
    <div className="space-y-24 py-12 md:py-20">
      {/* Header */}
      <section className="mx-auto max-w-4xl px-4 text-center md:px-8">
        <Reveal>
          <p className="text-xs font-medium uppercase tracking-luxe text-stone">Heritage & Evolution</p>
          <h1 className="mt-4 font-serif text-4xl font-medium leading-tight text-ink md:text-6xl">
            The Journey of LETTY
          </h1>
          <p className="mt-4 text-stone max-w-xl mx-auto text-sm md:text-base">
            From a private Parisian atelier to an international symbol of botanical luxury.
          </p>
        </Reveal>
      </section>

      {/* Hero Image */}
      <section className="mx-auto max-w-6xl px-4 md:px-8">
        <Reveal delay={0.1}>
          <div className="relative aspect-[21/9] w-full overflow-hidden bg-secondary">
            <LettyImage
              imageKey="storyAtelier"
              alt="LETTY Heritage Atelier"
              fill
              className="object-cover transition-transform duration-[10s] ease-out hover:scale-105"
            />
          </div>
        </Reveal>
      </section>

      {/* Timeline Section */}
      <section className="mx-auto max-w-4xl px-4 md:px-8">
        <Reveal className="text-center mb-16">
          <h2 className="font-serif text-3xl font-medium text-ink">Milestones in Craftsmanship</h2>
          <span aria-hidden className="block h-px w-24 mx-auto mt-4 bg-ink/30" />
        </Reveal>

        <motion.div
          className="space-y-0 max-w-2xl mx-auto"
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-60px" }}
        >
          {TIMELINE.map((item, index) => (
            <motion.div key={item.year} variants={staggerChild} className="flex group">
              <div className="relative flex flex-col items-center w-12 md:w-16 flex-shrink-0">
                <div className="h-3.5 w-3.5 rounded-full border-2 border-ink bg-ivory group-hover:bg-ink transition z-10 mt-1" />
                {index !== TIMELINE.length - 1 && (
                  <div className="absolute top-4 bottom-[-1rem] w-px bg-line -z-0" />
                )}
              </div>
              <div className="pb-12 md:pb-16 flex-1">
                <span className="text-[11px] font-medium uppercase tracking-luxe text-stone block -mt-0.5">
                  {item.year}
                </span>
                <h3 className="mt-1 font-serif text-2xl font-medium text-ink">{item.title}</h3>
                <p className="mt-2 text-sm text-stone leading-relaxed max-w-xl">
                  {item.description}
                </p>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* Sustainability Commitment */}
      <section className="bg-ivory py-20">
        <div className="mx-auto max-w-5xl px-4 md:px-8 grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <Reveal>
            <div className="relative aspect-square overflow-hidden bg-secondary">
              <LettyImage
                imageKey="storyHero"
                alt="Sustainable Luxury"
                fill
                className="object-cover"
              />
            </div>
          </Reveal>
          <Reveal delay={0.15}>
            <div className="space-y-6">
              <p className="text-[11px] uppercase tracking-luxe text-stone font-medium">Sustainable Future</p>
              <h2 className="font-serif text-3xl font-medium text-ink">
                Refillable Glass & Ethical Sourcing
              </h2>
              <p className="text-sm text-stone leading-relaxed">
                We believe luxury must honor the earth. All LETTY bottles are crafted from heavy-weight recyclable glass designed for lifetime reuse through our Concierge Refill Program.
              </p>
              <p className="text-sm text-stone leading-relaxed">
                Our botanical ingredients are 100% ethically harvested from small-holder farms in France, Italy, and Madagascar, supporting local agricultural communities and bio-diversity preservation.
              </p>
              <div className="pt-2">
                <LinedButton href="/shop">Explore Formulations</LinedButton>
              </div>
            </div>
          </Reveal>
        </div>
      </section>
    </div>
  );
}

