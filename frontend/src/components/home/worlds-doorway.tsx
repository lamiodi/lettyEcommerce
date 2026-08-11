import Link from "next/link";
import { LettyImage } from "@/components/shared/letty-image";
import { Reveal } from "@/components/shared/reveal";
import { DEPARTMENTS, type Department } from "@/lib/data/departments";

/**
 * Homepage — the Chanel-style category stack. The entire page is the four
 * worlds as full-bleed image blocks: category eyebrow, serif campaign
 * line and a solid "See More" button. Each click opens that world's
 * landing page (campaign → collections → products), never a bare grid.
 */
export function WorldsDoorway() {
  return (
    <section aria-label="Shop the worlds of Letty">
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
      className="group relative block h-[86dvh] overflow-hidden bg-ink md:h-[92dvh]"
    >
      <LettyImage
        imageKey={department.heroImageKey}
        alt={department.name}
        priority={index === 0}
        sizes="100vw"
        className="object-center transition-transform duration-700 ease-out group-hover:scale-105"
      />
      <div
        aria-hidden
        className="absolute inset-0 bg-gradient-to-t from-ink/60 via-ink/10 to-transparent"
      />

      <div className="absolute inset-0 flex items-end justify-center">
        <Reveal className="flex flex-col items-center gap-3 pb-16 text-center md:pb-20">
          <p className="text-[11px] font-medium uppercase tracking-luxe text-ivory/85">
            {department.name}
          </p>
          <h2 className="max-w-xl px-4 font-serif text-3xl font-medium italic leading-snug text-ivory md:text-5xl">
            {department.tagline}
          </h2>
          <span className="mt-4 inline-block bg-ivory px-10 py-3 text-[11px] font-medium uppercase tracking-luxe-sm text-ink transition-colors duration-300 group-hover:bg-white">
            See More
          </span>
        </Reveal>
      </div>
    </Link>
  );
}
