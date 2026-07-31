"use client";

import { Reveal } from "@/components/shared/reveal";
import { LinedButton } from "@/components/shared/lined-button";

/**
 * Bottom-of-page CTA — drives discovery with a gentle reveal.
 */
export function DiscoverCta() {
  return (
    <section className="py-24 text-center px-4 border-t border-line bg-surface">
      <Reveal>
        <h2 className="font-serif text-3xl font-medium text-ink mb-8">
          Ready to discover your next ritual?
        </h2>
        <div className="flex justify-center">
          <LinedButton href="/shop" width="max-w-[260px]">
            Explore All Collections
          </LinedButton>
        </div>
      </Reveal>
    </section>
  );
}
