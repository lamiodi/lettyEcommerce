import Link from "next/link";
import { Compass } from "lucide-react";

export default function NotFound() {
  return (
    <div className="mx-auto flex min-h-[65vh] max-w-lg flex-col items-center justify-center py-24 text-center px-4">
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-secondary text-gold">
        <Compass className="h-10 w-10" />
      </div>
      <p className="mt-6 text-xs font-medium uppercase tracking-luxe text-gold">
        404 — Page Not Found
      </p>
      <h1 className="mt-2 font-serif text-4xl font-medium text-ink md:text-5xl">
        A Solitary Path
      </h1>
      <p className="mt-3 text-sm text-stone max-w-sm">
        The formulation or page you are seeking does not exist or has been relocated within our sanctuary.
      </p>

      <div className="mt-8 flex flex-col sm:flex-row items-center gap-4">
        <Link
          href="/shop"
          className="inline-flex h-12 items-center rounded-lg bg-ink px-8 text-xs font-medium uppercase tracking-luxe-sm text-ivory transition hover:bg-ink/90"
        >
          Explore Boutique
        </Link>
        <Link
          href="/collections"
          className="inline-flex h-12 items-center rounded-lg border border-line px-8 text-xs font-medium uppercase tracking-luxe-sm text-ink transition hover:border-gold"
        >
          View Collections
        </Link>
        <Link
          href="/contact"
          className="inline-flex h-12 items-center rounded-lg border border-line px-8 text-xs font-medium uppercase tracking-luxe-sm text-ink transition hover:border-gold"
        >
          Contact Concierge
        </Link>
      </div>
    </div>
  );
}
