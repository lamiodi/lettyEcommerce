import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { LettyImage } from "@/components/shared/letty-image";
import { Reveal } from "@/components/shared/reveal";
import { getCollections } from "@/lib/data/catalog";

export const metadata: Metadata = {
  title: "Collections",
  description:
    "Cross-category edits composed by the LETTY concierge — The Edit, Golden Hour, The Silk Hair Ritual, The Glow Ritual and The Atelier.",
  alternates: { canonical: "/collections" },
};

export default async function CollectionsPage() {
  const collections = await getCollections();

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 md:px-8 md:py-16">
      <header className="mx-auto max-w-2xl text-center">
        <p className="text-xs font-medium uppercase tracking-luxe text-gold">Curated Edits</p>
        <h1 className="mt-3 font-serif text-4xl font-medium text-ink md:text-5xl">
          Collections
        </h1>
        <span aria-hidden className="rule-gold mx-auto mt-6 block h-px w-24" />
        <p className="mt-4 text-sm leading-relaxed text-stone">
          Each collection is composed the way an editor composes an issue —
          sparingly, and with intent.
        </p>
      </header>

      <div className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 md:gap-5">
        {collections.map((collection, i) => (
          <Reveal key={collection.id} delay={0.06 * (i % 3)}>
            <Link
              href={`/collections/${collection.slug}`}
              className="group relative block overflow-hidden rounded-xl bg-secondary"
            >
              <div className="relative aspect-[4/5] w-full">
                <LettyImage
                  imageKey={collection.imageKey}
                  alt={collection.name}
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  className="transition-transform duration-700 ease-out group-hover:scale-105"
                />
                <div
                  aria-hidden
                  className="absolute inset-0 bg-gradient-to-t from-ink/70 via-ink/10 to-transparent"
                />
                <div className="absolute inset-x-0 bottom-0 p-6">
                  {collection.productCount != null && (
                    <p className="text-[0.65rem] font-medium uppercase tracking-luxe text-gold">
                      {collection.productCount} pieces
                    </p>
                  )}
                  <h2 className="mt-1 font-serif text-2xl font-medium text-ivory">
                    {collection.name}
                  </h2>
                  <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-ivory/80">
                    {collection.description}
                  </p>
                  <p className="mt-4 inline-flex items-center gap-2 text-xs font-medium uppercase tracking-luxe-sm text-ivory transition-colors group-hover:text-gold">
                    Explore
                    <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" aria-hidden />
                  </p>
                </div>
              </div>
            </Link>
          </Reveal>
        ))}
      </div>
    </div>
  );
}
