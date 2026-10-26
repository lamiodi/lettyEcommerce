"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { Logo } from "@/components/shared/logo";
import { Reveal } from "@/components/shared/reveal";
import { SITE, SOCIAL_LINKS } from "@/lib/constants";
import { staggerChild, staggerContainer } from "@/lib/motion";
import { CurrencySwitcher } from "@/components/shared/currency-switcher";
import { useCurrencyStore } from "@/lib/store/currency";
import type { NavLink } from "@/lib/constants";

const LEFT_LINKS: NavLink[] = [
  { label: "Shop", href: "/shop" },
  { label: "Collections", href: "/collections" },
  { label: "Wishlist", href: "/wishlist" },
  { label: "VIP Sanctuary", href: "/vip" },
];

const RIGHT_LINKS: NavLink[] = [
  { label: "About Us", href: "/about" },
  { label: "Ambassadors", href: "/ambassadors" },
  { label: "Contact", href: "/contact" },
  { label: "FAQ", href: "/faq" },
];

const LEGAL_LINKS: NavLink[] = [
  { label: "Privacy Policy", href: "/privacy" },
  { label: "Terms & Conditions", href: "/terms" },
  { label: "Shipping & Delivery", href: "/shipping" },
  { label: "Returns & Exchanges", href: "/returns" },
];

/* ========================================================================= */
/* PAYMENT GATEWAY BADGES (Stripe)                                           */
/* ========================================================================= */

function ClearpayAfterpayBadge() {
  const country = useCurrencyStore((s) => s.country);
  const isUk = country.code === "GB";
  const brand = isUk ? "clearpay" : "afterpay";
  return (
    <div
      title={`${isUk ? "Clearpay" : "Afterpay"} - 4 Interest-Free Installments`}
      className="flex h-7 items-center justify-center rounded-[3px] border border-[#B2FCE4]/50 bg-[#B2FCE4] px-2 py-1 shadow-2xs"
    >
      <span className="font-sans text-[10px] font-bold text-black tracking-tight flex items-center">
        {brand}<span className="text-[11px] font-extrabold">&gt;</span>
      </span>
    </div>
  );
}

const PAYMENT_PROVIDERS = [
  {
    name: "Stripe",
    render: () => (
      <div
        key="stripe"
        title="Secure payments via Stripe"
        className="group flex h-7 items-center justify-center rounded-[3px] border border-line/80 bg-white px-2.5 py-1 shadow-2xs transition-all hover:border-gold/60"
      >
        <Image
          src="/ima/stripe_logo.png"
          alt="Stripe"
          width={50}
          height={20}
          className="h-3.5 w-auto object-contain"
        />
      </div>
    ),
  },
  {
    name: "Visa",
    render: () => (
      <div
        key="visa"
        title="Visa"
        className="flex h-7 items-center justify-center rounded-[3px] border border-line/80 bg-white px-2 py-1 shadow-2xs"
      >
        <span className="font-sans text-[11px] font-black italic tracking-tighter text-[#1A1F71]">
          VISA
        </span>
      </div>
    ),
  },
  {
    name: "Mastercard",
    render: () => (
      <div
        key="mastercard"
        title="Mastercard"
        className="flex h-7 items-center justify-center rounded-[3px] border border-line/80 bg-white px-2 py-1 shadow-2xs"
      >
        <div className="flex -space-x-1.5 items-center">
          <span className="h-3.5 w-3.5 rounded-full bg-[#EB001B]" />
          <span className="h-3.5 w-3.5 rounded-full bg-[#F79E1B] opacity-90" />
        </div>
      </div>
    ),
  },
  {
    name: "Apple Pay",
    render: () => (
      <div
        key="apple-pay"
        title="Apple Pay"
        className="flex h-7 items-center justify-center rounded-[3px] border border-line/80 bg-white px-2 py-1 shadow-2xs"
      >
        <span className="font-sans text-[10px] font-semibold text-black">
          Pay
        </span>
      </div>
    ),
  },
  {
    name: "Google Pay",
    render: () => (
      <div
        key="google-pay"
        title="Google Pay"
        className="flex h-7 items-center justify-center rounded-[3px] border border-line/80 bg-white px-2 py-1 shadow-2xs"
      >
        <span className="font-sans text-[10px] font-semibold text-[#5F6368]">
          <span className="font-bold text-[#4285F4]">G</span>Pay
        </span>
      </div>
    ),
  },
  {
    name: "Klarna",
    render: () => (
      <div
        key="klarna"
        title="Klarna - Pay in 3 or Pay Later"
        className="flex h-7 items-center justify-center rounded-[3px] border border-[#FFB3C7]/50 bg-[#FFB3C7] px-2 py-1 shadow-2xs"
      >
        <span className="font-sans text-[10px] font-bold text-black tracking-tight">
          Klarna.
        </span>
      </div>
    ),
  },
  {
    name: "Clearpay / Afterpay",
    render: () => <ClearpayAfterpayBadge key="clearpay-afterpay" />,
  },
  {
    name: "PayPal",
    render: () => (
      <div
        key="paypal"
        title="PayPal"
        className="flex h-7 items-center justify-center rounded-[3px] border border-[#FFC439] bg-[#FFC439] px-2.5 py-1 shadow-2xs"
      >
        <span className="font-sans text-[11px] font-extrabold italic tracking-tight">
          <span className="text-[#003087]">Pay</span><span className="text-[#0079C1]">Pal</span>
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

function FooterSocialLinks({ className = "" }: { className?: string }) {
  return (
    <div className={`flex flex-col items-center gap-2 ${className}`}>
      <p className="text-[10px] uppercase tracking-[0.2em] text-stone">Follow us</p>
      <ul className="flex flex-wrap items-center justify-center gap-x-7 gap-y-2">
        {SOCIAL_LINKS.map(social => (
          <li key={social.label}>
            <a href={social.href} target="_blank" rel="noopener noreferrer" aria-label={`Follow LETTY on ${social.label} (opens in a new tab)`} className="inline-flex min-h-11 items-center gap-2 text-[11px] font-medium uppercase tracking-luxe text-stone underline-offset-4 transition-colors hover:text-ink hover:underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ink">
              {social.label === "TikTok" ? (
                <svg viewBox="0 0 24 24" fill="currentColor" className="h-[18px] w-[18px] shrink-0" aria-hidden="true">
                  <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.74-.21.5-.15 1.06-.14 1.59.24 1.62 1.8 2.98 3.46 2.82 1.1-.01 2.15-.65 2.72-1.58.18-.32.38-.65.39-1.03.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07Z" />
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-[18px] w-[18px] shrink-0" aria-hidden="true">
                  <rect x="3" y="3" width="18" height="18" rx="5" />
                  <circle cx="12" cy="12" r="4" />
                  <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
                </svg>
              )}
              {social.label}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function Footer() {
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

          {/* 6. Social Channels */}
          <FooterSocialLinks className="w-full max-w-xs border-t border-line/60 pt-5" />

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
            <FooterSocialLinks className="mt-12" />
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

          {/* Row 4 — Guaranteed Safe & Secure Checkout Ribbon (Stripe) */}
          <Reveal delay={0.08}>
            <div className="mt-10 flex flex-col items-center justify-center border-t border-line/60 pt-7">
              <p className="text-[9px] font-medium uppercase tracking-[0.22em] text-stone/80 mb-3 text-center">
                Guaranteed Safe &amp; Secure Checkout
              </p>
              <div className="flex flex-wrap items-center justify-center gap-3">
                {PAYMENT_PROVIDERS.map((provider) => provider.render())}
              </div>
              <p className="mt-2.5 text-[10px] text-stone/70 text-center">
                Secure payments via Stripe. Available methods vary by location and device.
              </p>
            </div>
          </Reveal>

          {/* Row 5 — Copyright + currency switcher + tagline */}
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
