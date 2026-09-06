"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowUp,
  MessageCircle,
  Mail,
  ShieldCheck,
  Truck,
  Sparkles,
  ChevronRight,
  Lock,
} from "lucide-react";
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

const MOBILE_BOUTIQUE_LINKS: NavLink[] = [
  { label: "Shop All Products", href: "/shop" },
  { label: "Makeup & Beauty", href: "/departments/makeup-beauty" },
  { label: "Haute Fragrances", href: "/departments/fragrances" },
  { label: "Fashion Atelier", href: "/departments/fashion" },
  { label: "Signature Eyewear", href: "/departments/eyewear" },
  { label: "Curated Sets & Edit", href: "/collections" },
  { label: "Saved Wishlist", href: "/wishlist" },
];

const MOBILE_MAISON_LINKS: NavLink[] = [
  { label: "The House Story", href: "/story" },
  { label: "Atelier Philosophy", href: "/about" },
  { label: "Tracked UK & Global Delivery", href: "/shipping" },
  { label: "Statutory Returns & Hygiene", href: "/returns" },
  { label: "Client FAQ", href: "/faq" },
  { label: "Boutique Contact", href: "/contact" },
];

const LEGAL_LINKS: NavLink[] = [
  { label: "Privacy Policy", href: "/privacy" },
  { label: "Terms of Service", href: "/terms" },
  { label: "Shipping & Delivery", href: "/shipping" },
  { label: "Returns & Exchanges", href: "/returns" },
];

const TRUST_PILLARS = [
  {
    icon: Truck,
    title: "Tracked Dispatch",
    desc: "Royal Mail 48 & DPD Express",
  },
  {
    icon: ShieldCheck,
    title: "256-Bit SSL",
    desc: "Bank-Grade Encryption",
  },
  {
    icon: Sparkles,
    title: "Haute Formulations",
    desc: "Cruelty-Free & Tested",
  },
  {
    icon: Lock,
    title: "Direct Guarantee",
    desc: "Authentic Luxury Assurance",
  },
];

const PAYMENT_METHODS = [
  "Visa",
  "Mastercard",
  "Amex",
  "Apple Pay",
  "Google Pay",
  "PayPal",
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

export function Footer() {
  const scrollToTop = () => {
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const whatsappMessage = encodeURIComponent(
    "Hello LETTY Private Concierge, I would like assistance with..."
  );
  const whatsappUrl = `https://wa.me/447311564331?text=${whatsappMessage}`;

  return (
    <footer className="border-t border-line bg-ivory text-ink" aria-labelledby="footer-heading">
      <h2 id="footer-heading" className="sr-only">
        Footer
      </h2>

      <div className="mx-auto max-w-7xl px-5 py-12 sm:px-8 sm:py-16 md:py-20">
        {/* ========================================================= */}
        {/* MOBILE VIEW (< sm) — Ultra-Luxury Taste & Touch Ergonomics */}
        {/* ========================================================= */}
        <div className="sm:hidden flex flex-col items-center text-center space-y-9">
          {/* 1. Maison Monogram & Heritage Seal */}
          <div className="flex flex-col items-center">
            <div className="relative p-2">
              <Logo className="[&_img]:h-20 w-auto" />
            </div>
            <p className="mt-3 text-[10px] font-medium uppercase tracking-[0.28em] text-stone">
              The House of Luxury Beauty
            </p>
            <p className="mt-1 text-[9px] uppercase tracking-[0.22em] text-stone/70">
              London · Paris · Lagos
            </p>
            <div className="mt-3 flex items-center justify-center gap-3">
              <span className="h-px w-8 bg-gold/30" />
              <span className="text-[8px] text-gold/70">✦</span>
              <span className="h-px w-8 bg-gold/30" />
            </div>
          </div>

          {/* 2. Client Concierge & Advisory Card */}
          <div className="w-full rounded-2xl border border-gold/25 bg-surface/80 p-5 text-left shadow-xs backdrop-blur-xs">
            <div className="flex items-center justify-between border-b border-line/60 pb-3">
              <div>
                <span className="text-[9px] font-semibold uppercase tracking-[0.2em] text-gold">
                  Private Client Services
                </span>
                <h3 className="font-serif text-base font-medium text-ink mt-0.5">
                  LETTY Concierge
                </h3>
              </div>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-900/5 border border-emerald-600/20 px-2.5 py-1 text-[9px] font-medium text-emerald-800">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Live Advisory
              </span>
            </div>

            <p className="mt-3 text-xs leading-relaxed text-stone">
              Bespoke shade matching, fragrance curation, and direct order assistance with our London atelier.
            </p>

            <div className="mt-4 grid grid-cols-1 gap-2.5">
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex min-h-[44px] w-full items-center justify-between rounded-xl bg-ink px-4 py-2.5 text-xs font-medium uppercase tracking-wider text-ivory transition-all active:scale-[0.98] shadow-xs"
              >
                <span className="flex items-center gap-2">
                  <MessageCircle className="h-4 w-4 text-gold" />
                  <span>Chat on WhatsApp</span>
                </span>
                <span className="text-[10px] text-ivory/60 lowercase tracking-normal">
                  +44 7311 564331
                </span>
              </a>

              <a
                href={`mailto:${SITE.email}?subject=LETTY%20Atelier%20Inquiry`}
                className="flex min-h-[44px] w-full items-center justify-between rounded-xl border border-line bg-card/60 px-4 py-2.5 text-xs font-medium uppercase tracking-wider text-ink transition-all active:scale-[0.98]"
              >
                <span className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-stone" />
                  <span>Email Atelier</span>
                </span>
                <ChevronRight className="h-3.5 w-3.5 text-stone/60" />
              </a>
            </div>
          </div>

          {/* 3. Curated Mobile 2-Column Directory */}
          <div className="w-full grid grid-cols-2 gap-x-5 text-left border-t border-line/60 pt-7">
            {/* Boutique Column */}
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-stone pb-2 border-b border-line/40">
                Boutique
              </p>
              <ul className="mt-2 divide-y divide-line/25">
                {MOBILE_BOUTIQUE_LINKS.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="flex min-h-[42px] items-center text-[11px] font-medium tracking-wide uppercase text-ink/90 transition-colors active:text-gold"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Maison Column */}
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-stone pb-2 border-b border-line/40">
                Maison
              </p>
              <ul className="mt-2 divide-y divide-line/25">
                {MOBILE_MAISON_LINKS.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="flex min-h-[42px] items-center text-[11px] font-medium tracking-wide uppercase text-ink/90 transition-colors active:text-gold"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* 4. Regional Currency & Shipping Selector */}
          <div className="w-full rounded-2xl border border-line bg-surface/50 p-4 text-center">
            <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-stone block mb-2.5">
              Shipping Destination & Currency
            </span>
            <div className="flex w-full justify-center">
              <CurrencySwitcher variant="footer" className="w-full max-w-[240px]" />
            </div>
            <div className="mt-3 text-[11px] text-stone/90 flex flex-col items-center gap-0.5">
              <p className="font-medium text-ink">
                🇬🇧 UK Tracked Flat Rate: £4.99
              </p>
              <p className="text-[10px] text-stone">
                Complimentary delivery on orders over £150
              </p>
            </div>
          </div>

          {/* 5. Luxury Hallmarks & Trust Badges */}
          <div className="w-full grid grid-cols-2 gap-2.5 text-left">
            {TRUST_PILLARS.map((pillar) => {
              const Icon = pillar.icon;
              return (
                <div
                  key={pillar.title}
                  className="rounded-xl border border-line/60 bg-card/40 p-3 flex flex-col justify-between"
                >
                  <Icon className="h-4 w-4 text-gold mb-2" strokeWidth={1.5} />
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-ink">
                      {pillar.title}
                    </p>
                    <p className="text-[9px] text-stone mt-0.5 leading-snug">
                      {pillar.desc}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* 6. Payment Methods & Security Ribbon */}
          <div className="w-full border-t border-line/60 pt-6">
            <p className="text-[9px] font-medium uppercase tracking-[0.2em] text-stone/80 mb-3">
              Guaranteed Safe &amp; Secure Checkout
            </p>
            <div className="flex flex-wrap items-center justify-center gap-1.5">
              {PAYMENT_METHODS.map((method) => (
                <span
                  key={method}
                  className="rounded-md border border-line bg-surface/70 px-2.5 py-1 text-[10px] font-medium tracking-wider uppercase text-ink/80 shadow-2xs"
                >
                  {method}
                </span>
              ))}
            </div>
          </div>

          {/* 7. Social Channels */}
          <div className="w-full pt-1">
            <ul className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-[11px] uppercase tracking-[0.2em] text-stone font-medium">
              {SOCIAL_LINKS.map((s, idx) => (
                <li key={s.label} className="flex items-center gap-4">
                  <a
                    href={s.href}
                    target="_blank"
                    rel="noreferrer"
                    className="min-h-[36px] flex items-center transition-colors hover:text-ink active:text-gold"
                  >
                    {s.label}
                  </a>
                  {idx < SOCIAL_LINKS.length - 1 && (
                    <span className="text-stone/30 select-none" aria-hidden="true">
                      ·
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </div>

          {/* 8. UK Legal & Compliance Directory */}
          <div className="w-full border-t border-line/60 pt-6">
            <div className="grid grid-cols-2 gap-2">
              {LEGAL_LINKS.map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  className="min-h-[38px] flex items-center justify-center rounded-lg border border-line/60 bg-surface/40 px-2 text-[10px] font-medium uppercase tracking-wider text-stone transition-all active:text-ink active:bg-surface text-center"
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>

          {/* 9. Back to Top Smooth Trigger */}
          <div className="pt-2">
            <button
              type="button"
              onClick={scrollToTop}
              className="inline-flex items-center gap-2 rounded-full border border-line bg-card/60 px-5 py-2.5 text-[10px] font-medium uppercase tracking-widest text-stone shadow-2xs transition-all active:scale-95 hover:text-ink hover:border-gold"
            >
              <ArrowUp className="h-3.5 w-3.5 text-gold" />
              <span>Return to Top</span>
            </button>
          </div>

          {/* 10. Baseline Copyright & Statutory Notice */}
          <div className="space-y-1.5 pt-2 pb-1 text-center">
            <p className="text-[11px] text-stone">
              © {new Date().getFullYear()} {SITE.name} Luxury Beauty Group Ltd.
            </p>
            <p className="text-[9px] uppercase tracking-wider text-stone/70">
              Registered in England &amp; Wales · All rights reserved
            </p>
            <p className="text-[9px] font-medium uppercase tracking-[0.2em] text-gold/90 pt-1">
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

          {/* Row 3 — Centered Legal Links */}
          <Reveal delay={0.06}>
            <ul className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-[10px] uppercase tracking-luxe text-stone/80">
              {LEGAL_LINKS.map((item, idx) => (
                <li key={item.label} className="flex items-center gap-6">
                  <Link href={item.href} className="hover:text-ink transition-colors">
                    {item.label}
                  </Link>
                  {idx < LEGAL_LINKS.length - 1 && <span className="text-stone/30 select-none">·</span>}
                </li>
              ))}
            </ul>
          </Reveal>

          {/* Row 4 — Copyright + currency switcher + tagline */}
          <Reveal delay={0.1}>
            <div className="mt-8 flex flex-row items-center justify-between border-t border-line pt-8 text-left">
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
