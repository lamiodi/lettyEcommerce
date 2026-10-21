"use client";

import { LettyImage } from "@/components/shared/letty-image";
import { LinedButton } from "@/components/shared/lined-button";
import { Reveal } from "@/components/shared/reveal";

export function AboutContent() {
  return (
    <div className="space-y-14 py-10 md:space-y-24 md:py-20">
      {/* Hero text removed visually; h1 kept for SEO/accessibility */}
      <h1 className="sr-only">The House of LETTY</h1>

      {/* Founder's Vision & Philosophy: Beauty Without Limits */}
      <section className="mx-auto max-w-6xl px-4 py-12 md:px-8 md:py-20 lg:py-24">
        <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-12 lg:gap-16">
          {/* Founder Portrait */}
          <div className="lg:col-span-5">
            <Reveal>
              <div className="group relative mx-auto max-w-md lg:max-w-none">
                {/* Subtle luxury background border offset */}
                <div
                  aria-hidden
                  className="absolute -inset-2.5 -rotate-1 rounded-sm border border-gold/30 bg-secondary/60 transition-transform duration-700 ease-out group-hover:rotate-0"
                />

                <div className="relative aspect-[3/4] w-full overflow-hidden bg-secondary shadow-xl">
                  <LettyImage
                    imageKey="founderPortrait"
                    alt="LETTY Founder - Beauty Without Limits"
                    fill
                    priority
                    sizes="(max-width: 1024px) 100vw, 42vw"
                    className="object-cover object-top transition-transform duration-700 ease-out group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-ink/60 via-transparent to-transparent opacity-80" />
                </div>
              </div>
            </Reveal>
          </div>

          {/* Founder Narrative */}
          <div className="lg:col-span-7">
            <Reveal className="space-y-6 lg:pl-4">
              <div className="space-y-3">
                <h2 className="font-serif text-3xl font-bold tracking-tight text-ink md:text-4xl lg:text-5xl leading-tight">
                  LETTY, BEAUTY WITHOUT LIMITS
                </h2>
                <div className="h-px w-20 bg-gold/50" />
              </div>

              <div className="space-y-5 text-base md:text-lg leading-relaxed text-stone">
                <p className="font-forum text-2xl md:text-3xl text-ink font-normal italic leading-snug">
                  Beauty has always been my passion.
                </p>

                <p>
                  From a young age, I’ve loved makeup, fashion and everything that makes a person stand out. Whether it was a special occasion or an everyday moment, I always wanted to look and feel my best.
                </p>

                <p>
                  I’ve often heard people say that makeup is for those who don’t feel beautiful without it. I’ve never believed that.
                </p>

                {/* Editorial Pullquote */}
                <div className="border-l-2 border-gold/70 pl-6 py-3 my-6 bg-secondary/40">
                  <p className="font-forum text-2xl md:text-3xl text-ink font-medium leading-snug">
                    Makeup isn’t about hiding who you are. It’s about celebrating who you are.
                  </p>
                </div>

                <p>
                  That belief inspired LETTY — a brand built around confidence, individuality and the freedom to express yourself through beauty, fashion and style.
                </p>

                <p className="font-forum text-xl md:text-2xl text-ink font-normal pt-2">
                  Because beauty isn’t about changing yourself. It’s about embracing yourself.
                </p>
              </div>
            </Reveal>
          </div>
        </div>
      </section>


      {/* Call to Action */}
      <section className="mx-auto max-w-3xl text-center px-4">
        <Reveal>
          <h2 className="font-serif text-3xl font-medium text-ink">Discover the Edit</h2>
          <p className="mt-3 text-sm text-stone">
            Find your lip liner, lip gloss and lash essentials, or discover mwah Lip Balm.
          </p>
          <div className="mt-8 flex justify-center">
            <LinedButton href="/shop">Explore All Products</LinedButton>
          </div>
        </Reveal>
      </section>
    </div>
  );
}
