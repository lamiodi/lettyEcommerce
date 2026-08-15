"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Logo } from "@/components/shared/logo";
import { Reveal } from "@/components/shared/reveal";
import { SITE, SOCIAL_LINKS } from "@/lib/constants";
import { staggerChild, staggerContainer } from "@/lib/motion";
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
 * Template footer — single centered column with link rows flanking the
 * monogram, social links, then copyright and tagline over a hairline.
 *
 * Motion: staggered reveal on nav links when footer scrolls into view.
 *
 * Responsive behavior:
 *  - Mobile (default): logo on its own row, then 2-column link grid
 *  - sm+: logo and links flow into a single row
 *  - xl+: large horizontal gutters so the logo has comfortable breathing room
 */
export function Footer() {
  return (
    <footer className="border-t border-line bg-ivory" aria-labelledby="footer-heading">
      <h2 id="footer-heading" className="sr-only">
        Footer
      </h2>

      <div className="mx-auto flex max-w-7xl flex-col items-center gap-10 px-6 py-14 text-center sm:px-8 md:py-20">
        {/* Navigation & Logo */}
        <motion.nav
          aria-label="Footer"
          className="flex w-full flex-col items-center gap-8 sm:flex-row sm:flex-wrap sm:items-center sm:justify-center sm:gap-x-8 sm:gap-y-4 md:gap-x-10 lg:gap-x-14"
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-60px" }}
        >
          {/* Logo — on mobile sits on top with breathing room; on sm+ sits centered between link groups */}
          <motion.div
            className="order-first flex justify-center sm:order-2"
            variants={staggerChild}
          >
            <Logo className="[&_img]:h-20 sm:[&_img]:h-24 md:[&_img]:h-28" />
          </motion.div>

          {/* Left links group */}
          <div className="order-2 flex w-full max-w-xs justify-around gap-6 sm:order-1 sm:w-auto sm:max-w-none sm:justify-start sm:gap-x-8 md:gap-x-10 lg:gap-x-14">
            <div className="flex flex-col items-center gap-3 sm:flex-row sm:gap-x-8 md:gap-x-10 lg:gap-x-14">
              {LEFT_LINKS.map((link) => (
                <motion.div key={link.label} variants={staggerChild}>
                  <FooterLink {...link} />
                </motion.div>
              ))}
            </div>

            {/* Mobile-only right column for balanced 2-column grid */}
            <div className="flex flex-col items-center gap-3 sm:hidden">
              {RIGHT_LINKS.map((link) => (
                <motion.div key={link.label} variants={staggerChild}>
                  <FooterLink {...link} />
                </motion.div>
              ))}
            </div>
          </div>

          {/* Right links group (sm+ desktop view) */}
          <div className="hidden sm:order-3 sm:flex sm:items-center sm:gap-x-8 md:gap-x-10 lg:gap-x-14">
            {RIGHT_LINKS.map((link) => (
              <motion.div key={link.label} variants={staggerChild}>
                <FooterLink {...link} />
              </motion.div>
            ))}
          </div>
        </motion.nav>

        {/* Social Links */}
        <Reveal>
          <ul className="flex flex-wrap items-center justify-center gap-x-6 gap-y-3 px-4">
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

        {/* Copyright & Tagline */}
        <Reveal delay={0.1}>
          <div className="flex w-full flex-col items-center gap-2 border-t border-line px-4 pt-8 text-xs text-stone">
            <p className="text-center">
              © {new Date().getFullYear()} {SITE.name}. All rights reserved.
            </p>
            <p className="text-center font-serif italic text-stone/80">{SITE.tagline}</p>
          </div>
        </Reveal>
      </div>
    </footer>
  );
}
