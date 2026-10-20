"use client";

import { motion } from "framer-motion";
import { LettyImage } from "@/components/shared/letty-image";
import { LinedButton } from "@/components/shared/lined-button";
import { Reveal } from "@/components/shared/reveal";
import { staggerContainer, staggerChild } from "@/lib/motion";

const TIMELINE = [
  {
    year: "Define",
    title: "Velvet Sculpt Lip Liner",
    description:
      "Choose your shade and trace your lip shape. Pair your liner with gloss or wear it as part of your own lip look.",
  },
  {
    year: "Shine",
    title: "Glass Shine Lip Gloss",
    description:
      "Add a glossy finish with Glass Shine Lip Gloss. Explore the shades and application guidance on the product page.",
  },
  {
    year: "Lash",
    title: "The LETTY Lash Book",
    description:
      "Create your lash look with reusable cluster lashes in mixed lengths and volumes, with glue and remover included in the kit.",
  },
  {
    year: "Care",
    title: "Meet mwah Lip Balm",
    description:
      "A little love for your lips. Discover the 10 ml lip balm in Ivory and Noir packaging on our preorder page.",
  },
];

export function StoryContent() {
  return (
    <div className="space-y-14 py-10 md:space-y-24 md:py-20">
      {/* Header */}
      <section className="mx-auto max-w-4xl px-4 text-center md:px-8">
        <Reveal>
          <p className="text-xs font-medium uppercase tracking-luxe text-stone">The LETTY Beauty Edit</p>
          <h1 className="mt-4 font-serif text-4xl font-medium leading-tight text-ink md:text-6xl">
            Your Everyday LETTY
          </h1>
          <p className="mt-4 text-stone max-w-xl mx-auto text-sm md:text-base">
            Lip colour, a little shine, lashes and lip care. Discover the products that make up the LETTY beauty edit.
          </p>
        </Reveal>
      </section>

      {/* Hero Image */}
      <section className="mx-auto max-w-6xl px-4 md:px-8">
        <Reveal delay={0.1}>
          <div className="relative aspect-[4/3] w-full overflow-hidden bg-secondary md:aspect-[21/9]">
            <LettyImage
              imageKey="mwahIvory"
              alt="LETTY mwah Lip Balm in Ivory"
              fill
              className="object-cover transition-transform duration-[10s] ease-out hover:scale-105"
            />
          </div>
        </Reveal>
      </section>

      {/* Timeline Section */}
      <section className="mx-auto max-w-4xl px-4 md:px-8">
        <Reveal className="text-center mb-16">
          <h2 className="font-serif text-3xl font-medium text-ink">Find Your Routine</h2>
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
              <div className="min-w-0 pb-12 md:pb-16 flex-1">
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
                imageKey="mwahNoir"
                alt="LETTY mwah Lip Balm in Noir"
                fill
                className="object-cover"
              />
            </div>
          </Reveal>
          <Reveal delay={0.15}>
            <div className="space-y-6">
              <p className="text-[11px] uppercase tracking-luxe text-stone font-medium">A Little Love for Your Lips</p>
              <h2 className="font-serif text-3xl font-medium text-ink">
                Two Editions. One mwah.
              </h2>
              <p className="text-sm text-stone leading-relaxed">
                Choose Ivory or Noir, each finished with signature pink mwah lettering. The 10 ml balm helps lips feel soft, smooth and comfortable with a subtle sheen.
              </p>
              <p className="text-sm text-stone leading-relaxed">
                Visit the preorder page for the £17 price, estimated dispatch window, ingredients and full product information before ordering.
              </p>
              <div className="pt-2">
                <LinedButton href="/preorder">Discover mwah</LinedButton>
              </div>
            </div>
          </Reveal>
        </div>
      </section>
    </div>
  );
}
