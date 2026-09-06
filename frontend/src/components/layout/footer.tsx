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

/* ========================================================================= */
/* PAYMENT METHOD VECTOR LOGOS (Visa, Stripe, Apple Pay, Klarna, Clearpay)   */
/* ========================================================================= */

function VisaLogo({ className = "h-3.5 w-auto" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 38 12"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Visa"
    >
      <path
        d="M14.07 0.38L9.21 11.62H6.01L3.63 2.49C3.49 1.92 3.07 1.42 2.51 1.12C1.49 0.57 0 0.38 0 0.38L0.06 0.11H5.27C5.95 0.11 6.55 0.57 6.7 1.38L7.99 8.43L11.19 0.38H14.07ZM26.4 7.88C26.42 4.85 22.39 4.69 22.42 3.35C22.43 2.94 22.81 2.51 23.66 2.39C24.08 2.33 25.25 2.28 26.46 2.87L27 0.27C26.27 -0.01 25.33 -0.15 24.13 -0.15C21.22 -0.15 19.17 1.46 19.16 3.75C19.13 5.46 20.6 6.42 21.72 6.99C22.88 7.58 23.27 7.95 23.25 8.48C23.24 9.29 22.3 9.65 21.43 9.66C19.93 9.69 19.07 9.24 18.38 8.91L17.83 11.57C18.52 11.9 19.81 12.18 21.13 12.2C24.23 12.2 26.4 10.61 26.4 7.88ZM34.24 11.62H37.07L34.6 0.38H31.96C31.31 0.38 30.76 0.77 30.52 1.38L26.08 11.62H29.25L29.89 9.79H33.75L34.24 11.62ZM30.77 7.26L32.37 2.69L33.29 7.26H30.77ZM18.39 0.38L15.91 11.62H12.89L15.37 0.38H18.39Z"
        fill="#1A1F71"
      />
    </svg>
  );
}

function StripeLogo({ className = "h-3.5 w-auto" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 60 25"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Stripe"
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M60 13.06c0-4.83-2.38-8.66-7.05-8.66-4.7 0-7.57 3.83-7.57 8.61 0 5.67 3.51 8.56 8.35 8.56 2.37 0 4.15-.54 5.51-1.39v-3.71c-1.36.77-2.92 1.2-4.7 1.2-1.89 0-3.53-.74-3.77-2.86h9.17c.03-.43.06-1.25.06-1.75zm-9.25-1.77c.05-1.92 1.25-2.73 2.35-2.73 1.07 0 2.21.81 2.21 2.73h-4.56zM37.52 4.4c-1.95 0-3.23.91-3.9 1.55l-.25-1.25h-4.59v21.57l5.22-1.11.02-4.99c.7.53 1.83 1.39 3.65 1.39 3.73 0 6.9-2.99 6.9-8.64 0-5.46-3.26-8.52-7.05-8.52zm-1.28 13.09c-1.2 0-2.3-.43-2.88-.99l-.02-6.93c.63-.64 1.72-1.07 2.9-1.07 2.03 0 3.39 1.87 3.39 4.48 0 2.67-1.33 4.51-3.39 4.51zM23.01 3.22l5.25-1.12V-1L23.01.12v3.1zM28.26 4.7H23.01v16.48h5.25V4.7zM18.89 6.27L18.6 4.7h-4.54v16.48h5.22v-9.33c1.23-1.6 3.31-1.31 3.96-1.11V5.99c-.68-.24-2.81-.59-4.35.28zM9.46 8.54c-1.47-.64-2.51-1.07-2.51-1.97 0-.75.67-1.36 1.84-1.36 1.63 0 3.25.59 4.48 1.28l1.63-3.88C13.43 1.8 11.51 1.2 9.08 1.2 3.83 1.2.75 4.03.75 8.19c0 4.19 3.23 5.49 6.08 6.51 1.76.64 2.35 1.2 2.35 2.03 0 .88-.8 1.52-2.19 1.52-1.87 0-3.93-.8-5.36-1.76L0 20.35c1.71 1.09 4.05 1.79 6.88 1.79 5.6 0 8.8-2.75 8.8-7.04 0-4.05-3.04-5.36-6.22-6.56z"
        fill="#635BFF"
      />
    </svg>
  );
}

function ApplePayLogo({ className = "h-3.5 w-auto" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 50 21"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Apple Pay"
    >
      <path
        d="M8.6 7.42c-.52.62-1.36 1.1-2.22 1.03-.12-.86.3-1.74.77-2.29.53-.61 1.44-1.07 2.22-1.05.11.89-.25 1.69-.77 2.31zm.77 1.18c-1.22-.07-2.27.7-2.86.7-.59 0-1.5-.66-2.48-.64-1.27.02-2.45.74-3.1 1.88-1.33 2.29-.34 5.69.95 7.55.63.91 1.38 1.92 2.37 1.88.94-.04 1.3-.61 2.43-.61 1.14 0 1.46.61 2.44.59 1.01-.02 1.65-.92 2.27-1.83.72-1.05 1.01-2.07 1.03-2.12-.02-.02-1.98-.76-2-3.02-.02-1.89 1.54-2.8 1.61-2.85-.89-1.3-2.26-1.45-2.73-1.48l.07-.05zM22.8 5.67h-4.87v14.4h2.7v-4.67h2.17c3.15 0 5.25-2.03 5.25-4.87s-2.1-4.86-5.25-4.86zm-.17 7.31h-2v-4.89h2c1.78 0 2.84 1 2.84 2.45s-1.06 2.44-2.84 2.44zm11.75-2.58c-1.8 0-3.32 1.25-3.5 2.76h6.88c-.14-1.57-1.63-2.76-3.38-2.76zm-3.5 4.54c.2 1.55 1.69 2.65 3.59 2.65 1.26 0 2.41-.53 3.01-1.43l2.03 1.13c-.98 1.44-2.75 2.42-5.04 2.42-3.66 0-6.19-2.6-6.19-6.07 0-3.53 2.58-6.12 6.13-6.12 3.69 0 6.06 2.6 5.86 6.57l-9.39.85zm17.96-6.93l-4.22 10.36h-2.76l1.65-3.64-3.6-6.72h2.95l2.09 4.49 2.05-4.49h2.84l-1 2.15z"
        fill="#111111"
      />
    </svg>
  );
}

function KlarnaLogo({ className = "h-3.5 w-auto" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 76 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Klarna"
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M7.74 0H4.35V15.75H7.74V0ZM15.42 6.57L19.26 0H15.02L11.39 6.22V0H8.01V15.75H11.39V8.65L15.34 15.75H19.58L15.42 6.57ZM25.26 0H21.87V15.75H25.26V0ZM34.72 4.67C33.15 4.67 31.95 5.37 31.33 6.46V4.89H28.16V15.75H31.54V10.23C31.54 8.64 32.55 7.64 33.97 7.64C34.29 7.64 34.62 7.69 34.92 7.79V4.72C34.85 4.7 34.78 4.67 34.72 4.67ZM46.54 11.23C46.54 8.24 44.42 6.94 41.56 6.94C38.74 6.94 36.81 8.27 36.63 10.42H39.75C39.88 9.53 40.59 8.94 41.6 8.94C42.72 8.94 43.34 9.47 43.34 10.35V10.74L40.28 10.92C37.33 11.09 35.79 12.24 35.79 14.15C35.79 15.93 37.36 17.06 39.52 17.06C41.17 17.06 42.45 16.32 43.11 15.17V16.83H46.54V11.23ZM43.34 12.75C43.34 13.79 42.4 14.65 41.05 14.65C40.23 14.65 39.46 14.21 39.46 13.39C39.46 12.52 40.21 12.09 41.36 12.02L43.34 11.9V12.75ZM53.64 6.94C51.68 6.94 50.19 8.01 49.6 9.47V7.16H46.43V16.83H49.81V12.2C49.81 10.5 50.91 9.47 52.37 9.47C53.79 9.47 54.54 10.45 54.54 12.05V16.83H57.92V11.45C57.92 8.52 56.12 6.94 53.64 6.94ZM68.18 11.23C68.18 8.24 66.06 6.94 63.2 6.94C60.38 6.94 58.45 8.27 58.27 10.42H61.39C61.52 9.53 62.23 8.94 63.24 8.94C64.36 8.94 64.98 9.47 64.98 10.35V10.74L61.92 10.92C58.97 11.09 57.43 12.24 57.43 14.15C57.43 15.93 59 17.06 61.16 17.06C62.81 17.06 64.09 16.32 64.75 15.17V16.83H68.18V11.23ZM64.98 12.75C64.98 13.79 64.04 14.65 62.69 14.65C61.87 14.65 61.1 14.21 61.1 13.39C61.1 12.52 61.85 12.09 63 12.02L64.98 11.9V12.75ZM73.54 12.55C72.33 12.55 71.35 13.53 71.35 14.74C71.35 15.95 72.33 16.93 73.54 16.93C74.75 16.93 75.73 15.95 75.73 14.74C75.73 13.53 74.75 12.55 73.54 12.55Z"
        fill="#111111"
      />
    </svg>
  );
}

function ClearpayLogo({ className = "h-3.5 w-auto" }: { className?: string }) {
  return (
    <div className="flex items-center gap-1.5" aria-label="Clearpay">
      <svg
        className={className}
        viewBox="0 0 28 16"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M19.5 2.5L25 8L19.5 13.5M8.5 13.5L3 8L8.5 2.5"
          stroke="#111111"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M4.5 8H23.5"
          stroke="#111111"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
      </svg>
      <span className="font-sans font-bold text-[11px] tracking-tight text-ink lowercase">
        clearpay
      </span>
    </div>
  );
}

const PAYMENT_PROVIDERS = [
  {
    name: "Visa",
    render: () => (
      <div
        key="visa"
        title="Visa"
        className="flex h-8 min-w-[58px] items-center justify-center rounded-lg border border-line/80 bg-card px-2.5 shadow-2xs transition-all hover:border-gold/60"
      >
        <VisaLogo />
      </div>
    ),
  },
  {
    name: "Stripe",
    render: () => (
      <div
        key="stripe"
        title="Stripe"
        className="flex h-8 min-w-[58px] items-center justify-center rounded-lg border border-line/80 bg-card px-2.5 shadow-2xs transition-all hover:border-gold/60"
      >
        <StripeLogo />
      </div>
    ),
  },
  {
    name: "Apple Pay",
    render: () => (
      <div
        key="apple-pay"
        title="Apple Pay"
        className="flex h-8 min-w-[58px] items-center justify-center rounded-lg border border-line/80 bg-card px-2.5 shadow-2xs transition-all hover:border-gold/60"
      >
        <ApplePayLogo />
      </div>
    ),
  },
  {
    name: "Klarna",
    render: () => (
      <div
        key="klarna"
        title="Klarna"
        className="flex h-8 min-w-[62px] items-center justify-center rounded-lg border border-[#FFB3C7]/70 bg-[#FFB3C7]/20 px-2.5 shadow-2xs transition-all hover:border-[#FFB3C7]"
      >
        <KlarnaLogo />
      </div>
    ),
  },
  {
    name: "Clearpay",
    render: () => (
      <div
        key="clearpay"
        title="Clearpay"
        className="flex h-8 min-w-[76px] items-center justify-center rounded-lg border border-[#B2FCE4]/80 bg-[#B2FCE4]/25 px-2.5 shadow-2xs transition-all hover:border-[#B2FCE4]"
      >
        <ClearpayLogo />
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

          {/* Row 4 — Guaranteed Safe & Secure Checkout Ribbon (Visa, Stripe, Apple Pay, Klarna, Clearpay) */}
          <Reveal delay={0.08}>
            <div className="mt-10 flex flex-col items-center justify-center border-t border-line/60 pt-7">
              <p className="text-[9px] font-medium uppercase tracking-[0.22em] text-stone/80 mb-3 text-center">
                Guaranteed Safe &amp; Secure Checkout
              </p>
              <div className="flex flex-wrap items-center justify-center gap-2.5">
                {PAYMENT_PROVIDERS.map((provider) => provider.render())}
              </div>
              <p className="mt-2 text-[10px] text-stone/60 text-center">
                Pay in full or in 3–4 interest-free instalments with Klarna &amp; Clearpay
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
