"use client";

import Link from "next/link";
import { LettyImage } from "@/components/shared/letty-image";
import { LinedButton } from "@/components/shared/lined-button";
import { Reveal } from "@/components/shared/reveal";
import { cn } from "@/lib/utils";
import { DEPARTMENTS, type Department } from "@/lib/data/departments";

/**
 * Homepage category showcase, the Dior way — each world is an editorial
 * campaign block rather than a card: a large image on one side, the world
 * name, serif tagline and a "Discover" CTA on the other, alternating
 * sides down the page. Clicking a block opens the world's landing page
 * (campaign → selection → editorial → products), never a bare grid.
 */
export function WorldsDoorway() {
  return (
    <section aria-label="The worlds of Letty" className="bg-background">
      {DEPARTMENTS.map((department, i) => (
        <WorldBlock key={department.slug} department={department} index={i} />
      ))}
    </section>
  );
}

function WorldBlock({ department, index }: { department: Department; index: number }) {
  const reversed = index % 2 === 1;

  return (
    <Reveal>
      <div className="grid md:grid-cols-2">
        <Link
          href={`/departments/${department.slug}`}
          aria-label={`${department.name} — discover the world`}
          className={cn(
            "group relative block aspect-[4/3] overflow-hidden bg-ink md:aspect-auto md:h-[72vh]",
            reversed && "md:order-2",
          )}
        >
          <LettyImage
            imageKey={department.heroImageKey}
            alt={department.name}
            sizes="(max-width: 768px) 100vw, 50vw"
            className="object-center transition-transform duration-700 ease-out group-hover:scale-105"
          />
        </Link>

        <div
          className={cn(
            "flex flex-col items-center justify-center gap-4 bg-surface px-6 py-16 text-center md:h-[72vh] md:py-0",
            reversed && "md:order-1",
          )}
        >
          <p className="text-xs font-medium uppercase tracking-luxe text-gold">
            {String(index + 1).padStart(2, "0")}
          </p>
          <h2 className="font-serif text-2xl font-medium uppercase tracking-luxe text-ink md:text-3xl">
            {department.name}
          </h2>
          <p className="max-w-md font-serif text-3xl italic leading-snug text-stone md:text-4xl">
            {department.tagline}
          </p>
          <div className="mt-4">
            <LinedButton href={`/departments/${department.slug}`} width="max-w-[220px]">
              Discover
            </LinedButton>
          </div>
        </div>
      </div>
    </Reveal>
  );
}
