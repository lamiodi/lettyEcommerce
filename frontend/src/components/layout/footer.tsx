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
      className="text-[11px] font-medium uppercase tracking-luxe text-ink transition-colors duration-300 hover:text-stone whitespace-nowrap"
    >
      {label}
    </Link>
  );
}

/**
 * Footer — three balanced rows in a single centered column:
 *   1. Symmetric nav: left links · monogram · right links
 *   2. Centered social row
 *   3. Hairline divider with © left and tagline right (stacks on mobile)
 *
 * The nav row uses a CSS grid so the monogram stays exactly centered
 * regardless of the number of links on each side.
 */
export function Footer() {
  return (
    <footer className="border-t border-line bg-ivory" aria-labelledby="footer-heading">
      <h2 id="footer-heading" className="sr-only">
        Footer
      </h2>

      <div className="mx-auto max-w-7xl px-6 py-14 sm:px-8 md:py-20">
        {/* Row 1 — Symmetric nav: left links · monogram · right links */}
        <motion.nav
          aria-label="Footer"
          className="grid grid-cols-1 items-center gap-8 sm:grid-cols-[1fr_auto_1fr] sm:gap-x-10 lg:gap-x-16"
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-60px" }}
        >
          {/* Left links — right-aligned to sit opposite the right group */}
          <motion.ul
            className="order-2 flex flex-col items-center gap-3 sm:order-1 sm:flex-row sm:flex-wrap sm:justify-end sm:gap-x-8 md:gap-x-10 lg:gap-x-14"
            variants={staggerChild}
          >
            {LEFT_LINKS.map((link) => (
              <li key={link.label}>
                <FooterLink {...link} />
              </li>
            ))}
          </motion.ul>

          {/* Monogram — always exactly centered in the grid */}
          <motion.div
            className="order-1 flex justify-center sm:order-2"
            variants={staggerChild}
          >
            <Logo className="[&_img]:h-20 sm:[&_img]:h-24 md:[&_img]:h-28" />
          </motion.div>

          {/* Right links — left-aligned to sit opposite the left group */}
          <motion.ul
            className="order-3 flex flex-col items-center gap-3 sm:flex-row sm:flex-wrap sm:justify-start sm:gap-x-8 md:gap-x-10 lg:gap-x-14"
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
          <div className="mt-12 flex flex-col items-center gap-4 border-t border-line pt-8 text-center sm:flex-row sm:justify-between sm:text-left">
            <p className="text-xs text-stone">
              © {new Date().getFullYear()} {SITE.name}. All rights reserved.
            </p>
            <div className="order-first sm:order-none">
              <CurrencySwitcher variant="footer" />
            </div>
            <p className="text-[10px] font-medium uppercase tracking-luxe text-stone/80">
              {SITE.tagline}
            </p>
          </div>
        </Reveal>
      </div>
    </footer>
  );
}
