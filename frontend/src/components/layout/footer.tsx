"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Logo } from "@/components/shared/logo";
import { Reveal } from "@/components/shared/reveal";
import { SITE, SOCIAL_LINKS } from "@/lib/constants";
import { staggerChild, staggerContainer } from "@/lib/motion";
import { CurrencySwitcher } from "@/components/shared/currency-switcher";
import type { NavLink } from "@/lib/constants";

const LEFT_LINKS: NavLink[] = [
  { label: "Shop", href: "/shop" },
  { label: "Collections", href: "/collections" },
  { label: "Wishlist", href: "/wishlist" },
];

const RIGHT_LINKS: NavLink[] = [
  { label: "About", href: "/about" },
  { label: "Our Story", href: "/story" },
  { label: "Contact", href: "/contact" },
  { label: "FAQ", href: "/faq" },
];

function FooterLink({ label, href }: NavLink) {
  return (
    <Link
      href={href}
      className="text-[11px] font-medium uppercase tracking-luxe text-ink transition-colors duration-300 hover:text-stone whitespace-nowrap py-1.5 inline-block"
    >
      {label}
    </Link>
  );
}

/**
 * Footer — Responsive luxury architecture:
 *
 * Mobile layout (taste-optimized):
 *   1. Monogram + Maison subtitle
 *   2. Refined 2-column directory (Boutique & Maison) with touch-friendly targets
 *   3. Regional currency selection strip
 *   4. Inline social channels with dot dividers
 *   5. Centered copyright & tagline
 *
 * Desktop layout:
 *   Symmetric 3-column nav (left links · centered monogram · right links),
 *   social links row, and hairline divider bottom row.
 */
export function Footer() {
  return (
    <footer className="border-t border-line bg-ivory" aria-labelledby="footer-heading">
      <h2 id="footer-heading" className="sr-only">
        Footer
      </h2>

      <div className="mx-auto max-w-7xl px-6 py-12 sm:px-8 sm:py-16 md:py-20">
        {/* ========================================================= */}
        {/* MOBILE VIEW (< sm)                                        */}
        {/* ========================================================= */}
        <div className="sm:hidden flex flex-col items-center text-center">
          {/* Mobile Monogram & Identity */}
          <div className="flex flex-col items-center">
            <Logo className="[&_img]:h-16" />
            <p className="mt-3 text-[10px] uppercase tracking-[0.25em] text-stone">
              The House of Luxury Beauty
            </p>
          </div>

          {/* Mobile 2-Column Directory */}
          <div className="mt-8 grid w-full max-w-xs grid-cols-2 gap-x-6 border-t border-line/60 pt-7 text-left">
            <div>
              <p className="mb-3 text-[10px] font-medium uppercase tracking-[0.2em] text-stone">
                Boutique
              </p>
              <ul className="space-y-1">
                {LEFT_LINKS.map((link) => (
                  <li key={link.label}>
                    <FooterLink {...link} />
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <p className="mb-3 text-[10px] font-medium uppercase tracking-[0.2em] text-stone">
                Maison
              </p>
              <ul className="space-y-1">
                {RIGHT_LINKS.map((link) => (
                  <li key={link.label}>
                    <FooterLink {...link} />
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Mobile Dedicated Regional Currency Strip */}
          <div className="mt-8 flex w-full max-w-xs flex-col items-center justify-center gap-2.5 border-y border-line/60 py-4 text-center">
            <span className="text-[10px] uppercase tracking-luxe text-stone text-center">
              Shipping Destination & Currency
            </span>
            <div className="flex w-full justify-center">
              <CurrencySwitcher variant="footer" className="w-full max-w-[220px]" />
            </div>
          </div>

          {/* Mobile Social Links with Dot Separators */}
          <ul className="mt-7 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-[11px] uppercase tracking-luxe text-stone">
            {SOCIAL_LINKS.map((s, idx) => (
              <li key={s.label} className="flex items-center gap-4">
                <a
                  href={s.href}
                  target="_blank"
                  rel="noreferrer"
                  className="py-1 transition-colors hover:text-ink"
                >
                  {s.label}
                </a>
                {idx < SOCIAL_LINKS.length - 1 && (
                  <span className="text-stone/40 select-none" aria-hidden="true">
                    ·
                  </span>
                )}
              </li>
            ))}
          </ul>

          {/* Mobile Copyright & Tagline */}
          <div className="mt-7 pt-4 space-y-1.5">
            <p className="text-[11px] text-stone">
              © {new Date().getFullYear()} {SITE.name}. All rights reserved.
            </p>
            <p className="text-[9px] font-medium uppercase tracking-luxe text-stone/80">
              {SITE.tagline}
            </p>
          </div>
        </div>

        {/* ========================================================= */}
        {/* DESKTOP VIEW (>= sm)                                      */}
        {/* ========================================================= */}
        <div className="hidden sm:block">
          {/* Row 1 — Symmetric nav: left links · monogram · right links */}
          <motion.nav
            aria-label="Footer Navigation"
            className="grid grid-cols-[1fr_auto_1fr] items-center gap-x-10 lg:gap-x-16"
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-60px" }}
          >
            {/* Left links — right-aligned to sit opposite the right group */}
            <motion.ul
              className="flex flex-wrap justify-end gap-x-8 md:gap-x-10 lg:gap-x-14"
              variants={staggerChild}
            >
              {LEFT_LINKS.map((link) => (
                <li key={link.label}>
                  <FooterLink {...link} />
                </li>
              ))}
            </motion.ul>

            {/* Monogram — always exactly centered in the grid */}
            <motion.div className="flex justify-center" variants={staggerChild}>
              <Logo className="[&_img]:h-24 md:[&_img]:h-28" />
            </motion.div>

            {/* Right links — left-aligned to sit opposite the left group */}
            <motion.ul
              className="flex flex-wrap justify-start gap-x-8 md:gap-x-10 lg:gap-x-14"
              variants={staggerChild}
            >
              {RIGHT_LINKS.map((link) => (
                <li key={link.label}>
                  <FooterLink {...link} />
                </li>
              ))}
            </motion.ul>
          </motion.nav>

          {/* Row 2 — Centered social row */}
          <Reveal>
            <ul className="mt-12 flex flex-wrap items-center justify-center gap-x-8 gap-y-3">
              {SOCIAL_LINKS.map((s) => (
                <li key={s.label}>
                  <a
                    href={s.href}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-block py-1 text-[11px] font-medium uppercase tracking-luxe text-stone underline-offset-4 transition-colors duration-300 hover:text-ink hover:underline"
                  >
                    {s.label}
                  </a>
                </li>
              ))}
            </ul>
          </Reveal>

          {/* Row 3 — Copyright + currency switcher + tagline */}
          <Reveal delay={0.1}>
            <div className="mt-12 flex flex-row items-center justify-between border-t border-line pt-8 text-left">
              <p className="text-xs text-stone">
                © {new Date().getFullYear()} {SITE.name}. All rights reserved.
              </p>
              <div>
                <CurrencySwitcher variant="footer" />
              </div>
              <p className="text-[10px] font-medium uppercase tracking-luxe text-stone/80">
                {SITE.tagline}
              </p>
            </div>
          </Reveal>
        </div>
      </div>
    </footer>
  );
}
