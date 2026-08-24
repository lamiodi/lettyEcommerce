import Link from "next/link";
import { LettyImage } from "@/components/shared/letty-image";
import { Reveal } from "@/components/shared/reveal";
import { DEPARTMENTS, type Department } from "@/lib/data/departments";

/**
 * Homepage — the Chanel-style category stack.
 *
 * Each world is rendered as a full-bleed campaign block with calibrated viewport
 * height (h-[68svh] on mobile / h-[78vh] on desktop) so that the subsequent card
 * peek is always visible below the fold, inviting the user to scroll down.
 */
export function WorldsDoorway() {
  return (
    <section aria-label="Shop the worlds of Letty" className="relative w-full">
      {DEPARTMENTS.map((department, i) => (
        <WorldBlock key={department.slug} department={department} index={i} />
      ))}
    </section>
  );
}

function WorldBlock({ department, index }: { department: Department; index: number }) {
  return (
    <Link
      href={`/departments/${department.slug}`}
      aria-label={`${department.name} — see more`}
      className="group relative block h-[68svh] w-full overflow-hidden bg-ink border-b border-ivory/20 sm:h-[72svh] md:h-[78vh] lg:h-[82vh]"
    >
      <LettyImage
        imageKey={department.heroImageKey}
        alt={department.name}
        priority={index === 0}
        sizes="100vw"
        className="object-cover object-center transition-transform duration-700 ease-out group-hover:scale-105"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-gradient-to-t from-ink/80 via-ink/25 to-ink/10"
      />

      <div className="pointer-events-none absolute inset-0 flex items-end justify-center pb-12 sm:pb-14 md:pb-16">
        <Reveal className="flex flex-col items-center gap-3 px-4 text-center">
          <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-ivory/90 drop-shadow-sm sm:text-xs">
            {department.name}
          </p>
          <h2 className="max-w-xl font-heading text-xl font-bold uppercase tracking-[0.16em] leading-snug text-white drop-shadow-md whitespace-pre-line sm:text-2xl md:text-3xl lg:text-4xl">
            {department.tagline}
          </h2>
          <span className="mt-2 inline-flex items-center justify-center bg-white px-8 py-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-ink transition-all duration-300 group-hover:bg-ivory group-hover:shadow-lg sm:px-10 sm:py-3.5 sm:text-xs">
            See More
          </span>
        </Reveal>
      </div>
    </Link>
  );
}

