"use client";

import Link from "next/link";
import { collections } from "@/lib/mock/catalog";
import { MEGA_MENU_FEATURED } from "@/lib/constants";
import { LettyImage } from "@/components/shared/letty-image";
import { NavigationMenuLink } from "@/components/ui/navigation-menu";

/** Rich mega-menu panel shown under the "Collections" nav item. */
export function MegaMenuPanel() {
  return (
    <div className="grid w-[42rem] grid-cols-[1fr_1fr_1.2fr] gap-8 p-8">
      <div>
        <p className="mb-4 text-[11px] font-medium uppercase tracking-luxe text-stone">
          Curated Collections
        </p>
        <ul className="space-y-3">
          {collections.map((c) => (
            <li key={c.slug}>
              <NavigationMenuLink
                render={<Link href={`/collections/${c.slug}`} />}
                className="bg-transparent p-0 font-serif text-lg text-ink hover:bg-transparent hover:text-gold"
              >
                {c.name}
              </NavigationMenuLink>
            </li>
          ))}
        </ul>
      </div>

      <div>
        <p className="mb-4 text-[11px] font-medium uppercase tracking-luxe text-stone">
          Featured
        </p>
        <ul className="space-y-3">
          {MEGA_MENU_FEATURED.map((f) => (
            <li key={f.label}>
              <NavigationMenuLink
                render={<Link href={f.href} />}
                className="bg-transparent p-0 text-sm text-ink underline-offset-4 hover:bg-transparent hover:text-gold hover:underline"
              >
                {f.label}
              </NavigationMenuLink>
            </li>
          ))}
        </ul>
        <p className="mt-8 text-[11px] font-medium uppercase tracking-luxe text-stone">
          The Maison
        </p>
        <ul className="mt-3 space-y-3">
          <li>
            <NavigationMenuLink
              render={<Link href="/story" />}
              className="bg-transparent p-0 text-sm text-ink hover:bg-transparent hover:text-gold"
            >
              Our Story
            </NavigationMenuLink>
          </li>
          <li>
            <NavigationMenuLink
              render={<Link href="/about" />}
              className="bg-transparent p-0 text-sm text-ink hover:bg-transparent hover:text-gold"
            >
              About LETTY
            </NavigationMenuLink>
          </li>
        </ul>
      </div>

      <NavigationMenuLink
        render={<Link href="/collections/golden-hour" />}
        className="group relative block overflow-hidden rounded-xl p-0 hover:bg-transparent"
      >
        <span className="relative block aspect-[4/5]">
          <LettyImage
            imageKey="collectionFragrance"
            sizes="20vw"
            className="transition-transform duration-700 group-hover:scale-105"
          />
        </span>
        <span className="absolute inset-0 bg-gradient-to-t from-ink/60 via-transparent to-transparent" />
        <span className="absolute bottom-4 left-4 text-ivory">
          <span className="block text-[10px] uppercase tracking-luxe">New</span>
          <span className="block font-serif text-xl">Golden Hour</span>
        </span>
      </NavigationMenuLink>
    </div>
  );
}
