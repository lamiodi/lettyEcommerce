"use client";

import Link from "next/link";
import Image from "next/image";
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
  { label: "VIP Sanctuary", href: "/vip" },
];

const RIGHT_LINKS: NavLink[] = [
  { label: "About", href: "/about" },
  { label: "Our Story", href: "/story" },
  { label: "Ambassadors", href: "/ambassadors" },
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
  { label: "VIP Sanctuary (Inner Circle)", href: "/vip" },
  { label: "Creator Ambassador Atelier", href: "/ambassadors" },
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

/* ========================================================================= */
/* PAYMENT GATEWAY BADGES (Stripe & Paystack)                                */
/* ========================================================================= */

const PAYMENT_PROVIDERS = [
  {
    name: "Stripe",
    render: () => (
      <div
        key="stripe"
        title="Stripe - Encrypted 256-bit Global Checkout"
        className="group flex h-9 items-center justify-center rounded-lg border border-line/80 bg-white px-3.5 py-1.5 shadow-2xs transition-all hover:border-gold/60"
      >
        <Image
          src="/ima/stripe_logo.png"
          alt="Stripe"
          width={60}
          height={25}
          className="h-4 w-auto object-contain transition-transform group-hover:scale-105"
        />
      </div>
    ),
  },
  {
    name: "Paystack",
    render: () => (
      <div
        key="paystack"
        title="Paystack - Direct African Bank Transfer & USSD (Coming Soon)"
        className="group flex h-9 items-center gap-2 rounded-lg border border-dashed border-stone/35 bg-white/70 px-3 py-1.5 shadow-2xs transition-all hover:border-amber-400"
      >
        <Image
          src="/ima/paystack_logo.png"
          alt="Paystack"
          width={60}
          height={25}
          className="h-4 w-auto object-contain opacity-85 transition-transform group-hover:scale-105"
        />
        <span className="rounded-full bg-amber-100 px-2 py-0.5 font-mono text-[9px] font-semibold uppercase tracking-wider text-amber-900 border border-amber-300">
          Coming Soon
        </span>
      </div>
    ),
  },
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
        {/* MOBILE VIEW (< sm) — Quiet Luxury Minimalist               */}
        {/* ========================================================= */}
        <div className="sm:hidden flex flex-col items-center text-center space-y-7">
          {/* 1. Maison Monogram & Identity */}
          <div className="flex flex-col items-center">
            <Logo className="[&_img]:h-14 w-auto" />
            <p className="mt-3 text-[10px] uppercase tracking-[0.25em] text-stone">
              The House of Luxury Beauty
            </p>
          </div>

          {/* 2. Minimalist 2-Column Directory */}
          <div className="w-full max-w-xs grid grid-cols-2 gap-x-6 border-t border-line/60 pt-6 text-left">
            <div>
              <p className="mb-2.5 text-[10px] font-medium uppercase tracking-[0.2em] text-stone">
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
              <p className="mb-2.5 text-[10px] font-medium uppercase tracking-[0.2em] text-stone">
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

          {/* 3. Understated Concierge & Advisory Touchpoint */}
          <div className="w-full max-w-xs flex items-center justify-center gap-4 text-[11px] uppercase tracking-luxe text-stone border-t border-line/60 pt-5">
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="py-1 transition-colors hover:text-ink active:text-gold"
            >
              WhatsApp Concierge
            </a>
            <span className="text-stone/30 select-none" aria-hidden="true">
              ·
            </span>
            <a
              href={`mailto:${SITE.email}`}
              className="py-1 transition-colors hover:text-ink active:text-gold"
            >
              Atelier Email
            </a>
          </div>

          {/* 4. Minimalist Currency & Shipping Strip */}
          <div className="w-full max-w-xs flex flex-col items-center justify-center gap-2 border-t border-line/60 pt-5 text-center">
            <span className="text-[10px] uppercase tracking-luxe text-stone">
              Shipping Destination &amp; Currency
            </span>
            <div className="flex w-full justify-center">
              <CurrencySwitcher variant="footer" className="w-full max-w-[220px]" />
            </div>
          </div>

          {/* 5. Minimalist Payment Logos (Visa, Stripe, Apple Pay, Klarna, Clearpay) */}
          <div className="w-full max-w-xs flex flex-col items-center border-t border-line/60 pt-5">
            <p className="text-[9px] font-medium uppercase tracking-[0.22em] text-stone/80 mb-2.5 text-center">
              Guaranteed Safe &amp; Secure Checkout
            </p>
            <div className="flex flex-wrap items-center justify-center gap-2">
              {PAYMENT_PROVIDERS.map((provider) => provider.render())}
            </div>
          </div>

          {/* 6. Social Channels with Dot Separators */}
          <ul className="w-full max-w-xs flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-[11px] uppercase tracking-luxe text-stone border-t border-line/60 pt-5">
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

          {/* 7. Understated Legal Links */}
          <ul className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-[10px] uppercase tracking-luxe text-stone/80 border-t border-line/60 pt-5">
            {LEGAL_LINKS.map((item, idx) => (
              <li key={item.label} className="flex items-center gap-3">
                <Link href={item.href} className="hover:text-ink transition-colors py-0.5">
                  {item.label}
                </Link>
                {idx < LEGAL_LINKS.length - 1 && <span className="text-stone/30 select-none">·</span>}
              </li>
            ))}
          </ul>

          {/* 8. Baseline Copyright & Tagline */}
          <div className="space-y-1 pt-1 pb-2 text-center">
            <p className="text-[11px] text-stone">
              © {new Date().getFullYear()} {SITE.name} Luxury Beauty Group Ltd.
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

          {/* Row 4 — Guaranteed Safe & Secure Checkout Ribbon (Stripe & Paystack) */}
          <Reveal delay={0.08}>
            <div className="mt-10 flex flex-col items-center justify-center border-t border-line/60 pt-7">
              <p className="text-[9px] font-medium uppercase tracking-[0.22em] text-stone/80 mb-3 text-center">
                Guaranteed Safe &amp; Secure Checkout
              </p>
              <div className="flex flex-wrap items-center justify-center gap-3">
                {PAYMENT_PROVIDERS.map((provider) => provider.render())}
              </div>
              <p className="mt-2.5 text-[10px] text-stone/70 text-center">
                Encrypted 256-bit SSL checkout via Stripe • Direct African banking via Paystack coming soon
              </p>
            </div>
          </Reveal>

          {/* Row 5 — Copyright + currency switcher + tagline */}
          <Reveal delay={0.1}>
            <div className="mt-8 flex flex-row items-center justify-between border-t border-line pt-8 text-left">
              <p className="text-xs text-stone">
                © {new Date().getFullYear()} {SITE.name} Luxury Beauty Group Ltd. All rights reserved.
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
