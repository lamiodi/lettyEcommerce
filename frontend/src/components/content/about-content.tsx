"use client";

import { LettyImage } from "@/components/shared/letty-image";
import { LinedButton } from "@/components/shared/lined-button";
import type { ImageKey } from "@/lib/images";

const PILLARS: { title: string; description: string; imageKey: ImageKey }[] = [
  {
    title: "Botanical Purity",
    description:
      "Formulated with cold-pressed botanical elixirs, organic rare floras, and active bio-ferments designed for deep Cellular Synergy.",
    imageKey: "editorialSkinCeremony",
  },
  {
    title: "Artisanal Craftsmanship",
    description:
      "Small-batch micro-blends curated in our Parisian and Grasse ateliers to ensure unmatched potency, aroma stability, and texture.",
    imageKey: "brandStory",
  },
  {
    title: "Timeless Elegance",
    description:
      "Designed to elevate everyday routines into sensory rituals, encapsulated in hand-blown glass and sustainable refillable vessels.",
    imageKey: "heroEditorial",
  },
];

const STATS = [
  { value: "100%", label: "Cruelty-Free & Vegan" },
  { value: "0%", label: "Parabens, Sulfates, Silicones" },
  { value: "98.4%", label: "Bio-Active Natural Origin" },
  { value: "14", label: "Global Concierge Outposts" },
];

export function AboutContent() {
  return (
    <div className="space-y-24 py-12 md:py-20">
      {/* Hero Section */}
      <section className="mx-auto max-w-5xl px-4 text-center md:px-8">
        <p className="text-xs font-medium uppercase tracking-luxe text-stone">The House of LETTY</p>
        <h1 className="mt-4 font-serif text-4xl font-medium leading-tight text-ink md:text-6xl">
          Where Botanical Science Meets Uncompromising Luxury
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-base text-stone md:text-lg">
          Founded on the principle that self-care is a sacred ritual, LETTY merges rare European botanicals with clinical precision to honor your hair, skin, and sensory wellbeing.
        </p>
      </section>

      {/* Cinematic Banner */}
      <section className="relative h-[65vh] min-h-[450px] w-full overflow-hidden">
        <LettyImage
          imageKey="aboutHero"
          alt="LETTY Atelier"
          fill
          className="object-cover object-center brightness-90"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-ink/60 via-transparent to-transparent flex items-end">
          <div className="mx-auto max-w-7xl px-4 pb-12 text-ivory md:px-8">
            <p className="text-xs uppercase tracking-luxe text-ivory/80 font-medium">Paris • Grasse • London</p>
            <h2 className="mt-2 font-serif text-3xl font-medium md:text-4xl">
              An Atelier Born in Paris
            </h2>
          </div>
        </div>
      </section>

      {/* Narrative Section */}
      <section className="mx-auto max-w-4xl px-4 md:px-8">
        <div className="grid grid-cols-1 gap-12 md:grid-cols-2 items-center">
          <div className="space-y-6">
            <h2 className="font-serif text-3xl font-medium text-ink">
              The Philosophy of Sacred Rituals
            </h2>
            <p className="text-sm leading-relaxed text-stone">
              Every LETTY formulation originates from a singular belief: true luxury lies in intention. We reject mass production in favor of meticulous micro-batching, sourcing rare botanicals from sustainable harvests across Grasse, Provence, and the Swiss Alps.
            </p>
            <p className="text-sm leading-relaxed text-stone">
              Whether restoring moisture to delicate hair fibers or elevating your ambient space with handcrafted fragrances, our creations are built to nourish body and spirit alike.
            </p>
          </div>
          <div className="relative aspect-[4/5] overflow-hidden bg-secondary">
            <LettyImage
              imageKey="productParfumGold"
              alt="LETTY Luxury Bottle"
              fill
              className="object-cover"
            />
          </div>
        </div>
      </section>

      {/* Three Pillars */}
      <section className="bg-ivory py-20">
        <div className="mx-auto max-w-7xl px-4 md:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <p className="text-xs font-medium uppercase tracking-luxe text-stone">Our Foundation</p>
            <h2 className="mt-3 font-serif text-3xl font-medium text-ink md:text-4xl">
              The Three Pillars of LETTY
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-x-5 gap-y-12 md:grid-cols-3">
            {PILLARS.map((pillar) => (
              <div key={pillar.title} className="group flex flex-col">
                <div className="relative aspect-[4/3] overflow-hidden bg-secondary">
                  <LettyImage
                    imageKey={pillar.imageKey}
                    alt={pillar.title}
                    fill
                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                </div>
                <h3 className="mt-6 text-center font-serif text-xl font-medium text-ink">
                  {pillar.title}
                </h3>
                <p className="mt-3 text-center text-sm leading-relaxed text-stone">
                  {pillar.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Key Metrics / Stats */}
      <section className="mx-auto max-w-6xl px-4 md:px-8">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4 text-center md:divide-x md:divide-line">
          {STATS.map((stat) => (
            <div key={stat.label} className="p-4">
              <p className="font-serif text-4xl font-medium text-ink md:text-5xl">{stat.value}</p>
              <p className="mt-2 text-[11px] uppercase tracking-luxe text-stone">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Founder Quote */}
      <section className="mx-auto max-w-4xl px-4 text-center md:px-8">
        <div className="border-y border-line py-12">
          <p className="font-serif text-2xl italic font-normal text-ink md:text-3xl leading-relaxed">
            &ldquo;Beauty is not an obligation—it is a sanctuary. We created LETTY to bring grace, serenity, and performance back to your daily rituals.&rdquo;
          </p>
          <p className="mt-6 block text-[11px] uppercase tracking-luxe text-stone not-italic font-medium">
            — Colette & Julien Vane, Founders
          </p>
        </div>
      </section>

      {/* Call to Action */}
      <section className="mx-auto max-w-3xl text-center px-4">
        <h2 className="font-serif text-3xl font-medium text-ink">Discover the Edit</h2>
        <p className="mt-3 text-sm text-stone">
          Experience the formulations curated by our Parisian master perfumers and hair specialists.
        </p>
        <div className="mt-8 flex justify-center">
          <LinedButton href="/shop">Explore All Products</LinedButton>
        </div>
      </section>
    </div>
  );
}
