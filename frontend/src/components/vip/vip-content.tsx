"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Crown,
  Sparkles,
  Gift,
  ArrowUpRight,
  Check,
  Star,
  Copy,
  ChevronDown,
  ShoppingBag,
  Heart,
  Users,
  ShieldCheck,
  Award,
} from "lucide-react";
import { EASE_LUXURY } from "@/lib/motion";

function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
    </svg>
  );
}

const TIERS = [
  {
    name: "Patron",
    badge: "Tier 01",
    spend: "Free to Join",
    pointsMultiplier: "1x Points",
    description: "Welcome to our sanctuary. Begin your journey with instant welcome points and early drops.",
    perks: [
      "50 Welcome Points immediately",
      "Earn 1 point per £1 spent",
      "Early access to seasonal drops (24h)",
      "Birthday Atelier discovery sample",
      "Complimentary standard shipping on £40+",
    ],
    highlight: false,
  },
  {
    name: "Devotee",
    badge: "Tier 02",
    spend: "£250+ Annual Spend",
    pointsMultiplier: "1.5x Points",
    description: "For our dedicated connoisseurs. Elevated points earning and seasonal gifting suites.",
    perks: [
      "Earn 1.5 points per £1 spent",
      "Complimentary Deluxe Birthday Gifting Suite",
      "Free UK Tracked Delivery on all orders",
      "48-hour priority pre-launch allocation",
      "Quarterly secret archive access",
      "Priority client concierge service",
    ],
    highlight: true,
  },
  {
    name: "Sanctuary Inner Circle",
    badge: "Tier 03",
    spend: "£600+ Annual Spend",
    pointsMultiplier: "2x Points",
    description: "Our most confidential tier. Bespoke allocations, private lab trials, and dedicated concierge.",
    perks: [
      "Earn 2 points per £1 spent",
      "Full-Size Bespoke Birthday & Anniversary Vault",
      "Free Worldwide Express Delivery on all orders",
      "1-week early pre-order on all atelier collections",
      "Direct WhatsApp access to your personal beauty concierge",
      "Invitations to private showroom dinners & atelier previews",
    ],
    highlight: false,
  },
];

const WAYS_TO_EARN = [
  {
    icon: Users,
    points: "+50 PTS",
    title: "Create an Account",
    desc: "Join the Inner Circle and receive immediate welcome credit.",
  },
  {
    icon: ShoppingBag,
    points: "1 PT / £1",
    title: "Shop LETTY Formulations",
    desc: "Earn points with every shade, formulation, and accessory purchased.",
  },
  {
    icon: Star,
    points: "+25 PTS",
    title: "Leave a Verified Review",
    desc: "Share your authentic ritual and experience with our community.",
  },
  {
    icon: Gift,
    points: "+100 PTS",
    title: "Celebrate Your Birthday",
    desc: "Enjoy an annual points deposit and complimentary gifting suite.",
  },
  {
    icon: InstagramIcon,
    points: "+20 PTS",
    title: "Follow On Instagram",
    desc: "Connect with @lettybeautyofficial for daily editorial inspiration.",
  },
  {
    icon: Heart,
    points: "+100 PTS",
    title: "Refer a Patron",
    desc: "Give a friend £10 off, and receive 100 points when they complete their first order.",
  },
];

const POINTS_REDEMPTION = [
  { points: 100, discount: "£10 Off", code: "PATRON10", minSpend: "No min. spend" },
  { points: 200, discount: "£20 Off", code: "PATRON20", minSpend: "On orders £50+" },
  { points: 500, discount: "£50 Off", code: "PATRON50", minSpend: "On orders £100+" },
  { points: 1000, discount: "£100 Atelier Credit", code: "PATRON100", minSpend: "Full order credit" },
];

const FAQS = [
  {
    q: "How do I become a member of LETTY's Inner Circle?",
    a: "Membership is complimentary and instantaneous. Simply create a LETTY account online. You will automatically receive 50 Atelier Points to begin your loyalty journey.",
  },
  {
    q: "Do my Atelier Points expire?",
    a: "Your points remain active for 12 months from the date of your last order. Any new purchase resets your points balance validity for another full year.",
  },
  {
    q: "How do tier upgrades work?",
    a: "Your tier is calculated based on your total spend over a rolling 12-month period. Once you hit £250, you are instantly upgraded to Devotee status; at £600, you enter the Sanctuary Inner Circle with elevated perks valid for the next 12 months.",
  },
  {
    q: "Can I combine loyalty discounts with promotional codes?",
    a: "Atelier Points can be redeemed for store voucher codes that apply alongside complimentary shipping thresholds. One voucher code can be applied per checkout transaction.",
  },
  {
    q: "How do I claim my Birthday Gifting Suite?",
    a: "Ensure your birth month is saved in your account settings at least 14 days before your birthday. On the 1st of your birth month, you'll receive a confidential code by email to add your curated gifting suite to your next order.",
  },
];

export function VipContent() {
  const [selectedPointsTier, setSelectedPointsTier] = useState(0);
  const [copiedReferral, setCopiedReferral] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [joinEmail, setJoinEmail] = useState("");
  const [joinedSuccess, setJoinedSuccess] = useState(false);

  const handleCopyReferral = () => {
    navigator.clipboard.writeText("https://letty.com/vip?ref=CIRCLE10");
    setCopiedReferral(true);
    setTimeout(() => setCopiedReferral(false), 2500);
  };

  const handleJoinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinEmail) return;
    setJoinedSuccess(true);
  };

  return (
    <div className="w-full bg-ivory text-ink selection:bg-gold/20 selection:text-ink">
      {/* 1. HERO SECTION (Inspired by VIP Header) */}
      <section className="relative w-full overflow-hidden bg-ink py-20 px-4 sm:py-28 sm:px-6 md:px-8 lg:py-36 lg:px-12">
        {/* Background Editorial Image */}
        <div className="absolute inset-0 z-0">
          <Image
            src="/ima/IMG_6999.PNG"
            alt="Letty Beauty VIP Inner Circle"
            fill
            priority
            sizes="100vw"
            className="object-cover object-[center_35%] opacity-55 scale-105 transition-transform duration-1000"
          />
          {/* Multi-layered luxury scrims */}
          <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/60 to-ink/40" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(26,20,18,0.7)_100%)]" />
        </div>

        <div className="relative z-10 mx-auto max-w-4xl text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: EASE_LUXURY }}
          >
            <div className="inline-flex items-center gap-2 rounded-full bg-ivory/10 backdrop-blur-md px-4 py-1.5 text-xs font-medium uppercase tracking-luxe text-gold ring-1 ring-gold/30 mb-6">
              <Crown className="h-3.5 w-3.5 text-gold" />
              <span>The Inner Circle · Loyalty Sanctuary</span>
            </div>

            <h1 className="font-serif text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-normal uppercase tracking-[0.14em] text-ivory mb-6 leading-[1.1]">
              JOIN LETTY&apos;S <span className="text-gold italic font-light">VIPS</span>
            </h1>

            <p className="mx-auto max-w-2xl text-sm sm:text-base md:text-lg text-ivory/80 font-light leading-relaxed mb-10">
              An invitation-only loyalty sanctuary designed for our most discerning patrons.
              Unlock confidential allocations, bespoke concierge gifting suites, and elevate your daily ritual.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-4">
              <a
                href="#join-section"
                className="group inline-flex items-center justify-center gap-2 rounded-full bg-gold px-8 sm:px-10 py-3.5 sm:py-4 text-xs sm:text-sm font-semibold uppercase tracking-luxe text-ink shadow-[0_8px_30px_rgba(169,138,95,0.4)] transition-all duration-300 hover:bg-[#bfa073] hover:-translate-y-0.5"
              >
                <span>Join The Circle</span>
                <ArrowUpRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </a>

              <Link
                href="/login"
                className="inline-flex items-center justify-center rounded-full bg-ivory/10 backdrop-blur-md px-8 sm:px-10 py-3.5 sm:py-4 text-xs sm:text-sm font-semibold uppercase tracking-luxe text-ivory ring-1 ring-white/20 transition-all duration-300 hover:bg-ivory/20 hover:text-white"
              >
                Sign In To Account
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* 2. HOW IT WORKS (3-Step Editorial Ribbon) */}
      <section className="relative w-full border-y border-stone/15 bg-white/50 py-12 px-4 sm:px-6 lg:px-12 backdrop-blur-xs">
        <div className="mx-auto max-w-6xl">
          <p className="text-center text-xs font-semibold uppercase tracking-luxe text-gold mb-8">
            The Three Pillars of Membership
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
            <div className="flex items-center gap-4 rounded-2xl bg-ivory/80 p-5 ring-1 ring-stone/10 shadow-xs">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-ink text-gold font-serif text-base font-semibold">
                1
              </span>
              <div>
                <h4 className="font-serif text-sm uppercase tracking-wider font-semibold text-ink">
                  Join The Circle
                </h4>
                <p className="text-xs text-stone leading-relaxed mt-0.5">
                  Receive 50 welcome Atelier Points the moment you enroll.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4 rounded-2xl bg-ivory/80 p-5 ring-1 ring-stone/10 shadow-xs">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-ink text-gold font-serif text-base font-semibold">
                2
              </span>
              <div>
                <h4 className="font-serif text-sm uppercase tracking-wider font-semibold text-ink">
                  Earn On Every Formula
                </h4>
                <p className="text-xs text-stone leading-relaxed mt-0.5">
                  Collect points automatically with every purchase, review, &amp; referral.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4 rounded-2xl bg-ivory/80 p-5 ring-1 ring-stone/10 shadow-xs">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-ink text-gold font-serif text-base font-semibold">
                3
              </span>
              <div>
                <h4 className="font-serif text-sm uppercase tracking-wider font-semibold text-ink">
                  Redeem Bespoke Luxury
                </h4>
                <p className="text-xs text-stone leading-relaxed mt-0.5">
                  Exchange points for voucher credits, secret archives, and lab gifts.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. ATELIER REWARDS SHOWCASE */}
      <section className="relative w-full py-16 px-4 sm:py-24 sm:px-6 md:px-8 lg:px-12">
        <div className="mx-auto max-w-6xl">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <p className="text-xs font-semibold uppercase tracking-luxe text-gold mb-2">
              Patron Privileges
            </p>
            <h2 className="font-serif text-3xl sm:text-4xl font-normal uppercase tracking-[0.14em] text-ink">
              VIP REWARDS &amp; PERKS
            </h2>
            <span aria-hidden className="rule-gold mx-auto my-4 block h-px w-20" />
            <p className="text-xs sm:text-sm text-stone font-light leading-relaxed">
              Curated treats reserved exclusively for members of our Inner Circle.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="group relative overflow-hidden rounded-3xl bg-white p-6 shadow-sm ring-1 ring-black/5 transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-secondary/80 text-gold mb-5">
                <Gift className="h-6 w-6" />
              </div>
              <h3 className="font-serif text-base font-semibold uppercase tracking-wider text-ink mb-2">
                Birthday Gifting Suite
              </h3>
              <p className="text-xs text-stone leading-relaxed">
                A complimentary full-size formula selected for your complexion delivered during your birth month.
              </p>
            </div>

            <div className="group relative overflow-hidden rounded-3xl bg-white p-6 shadow-sm ring-1 ring-black/5 transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-secondary/80 text-gold mb-5">
                <Sparkles className="h-6 w-6" />
              </div>
              <h3 className="font-serif text-base font-semibold uppercase tracking-wider text-ink mb-2">
                Secret Archive Drops
              </h3>
              <p className="text-xs text-stone leading-relaxed">
                Confidential allocations and limited-edition seasonal vaults made available before public reveal.
              </p>
            </div>

            <div className="group relative overflow-hidden rounded-3xl bg-white p-6 shadow-sm ring-1 ring-black/5 transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-secondary/80 text-gold mb-5">
                <Award className="h-6 w-6" />
              </div>
              <h3 className="font-serif text-base font-semibold uppercase tracking-wider text-ink mb-2">
                Deluxe Lab Samples
              </h3>
              <p className="text-xs text-stone leading-relaxed">
                Receive unreleased preview vials and artisanal lab test batches tucked into every dispatch.
              </p>
            </div>

            <div className="group relative overflow-hidden rounded-3xl bg-white p-6 shadow-sm ring-1 ring-black/5 transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-secondary/80 text-gold mb-5">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <h3 className="font-serif text-base font-semibold uppercase tracking-wider text-ink mb-2">
                Private Concierge
              </h3>
              <p className="text-xs text-stone leading-relaxed">
                Direct WhatsApp advisory line with our master artists for shade matching and bespoke routine curation.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 4. HOW TO USE YOUR POINTS (Interactive Calculator) */}
      <section className="relative w-full bg-secondary/40 py-16 px-4 sm:py-20 sm:px-6 md:px-8 lg:px-12 border-y border-stone/15">
        <div className="mx-auto max-w-5xl">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <p className="text-xs font-semibold uppercase tracking-luxe text-gold mb-2">
              Atelier Currency
            </p>
            <h2 className="font-serif text-3xl sm:text-4xl font-normal uppercase tracking-[0.14em] text-ink">
              HOW TO USE YOUR POINTS
            </h2>
            <p className="text-xs sm:text-sm text-stone mt-2">
              Redeem your points at checkout for immediate order savings.
            </p>
          </div>

          {/* Points Tier Tabs */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-8">
            {POINTS_REDEMPTION.map((tier, idx) => {
              const isSelected = selectedPointsTier === idx;
              return (
                <button
                  key={tier.points}
                  type="button"
                  onClick={() => setSelectedPointsTier(idx)}
                  className={`flex flex-col items-center justify-center rounded-2xl p-5 text-center transition-all duration-300 cursor-pointer ${
                    isSelected
                      ? "bg-ink text-ivory shadow-lg ring-2 ring-gold scale-[1.02]"
                      : "bg-white text-ink shadow-xs ring-1 ring-black/5 hover:bg-ivory hover:shadow-md"
                  }`}
                >
                  <span className={`text-xs uppercase tracking-wider font-semibold ${isSelected ? "text-gold" : "text-stone"}`}>
                    {tier.points} Points
                  </span>
                  <span className="font-serif text-xl sm:text-2xl font-semibold my-1">
                    {tier.discount}
                  </span>
                  <span className={`text-[11px] ${isSelected ? "text-ivory/70" : "text-stone"}`}>
                    {tier.minSpend}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Active Redemption Summary Card */}
          <div className="rounded-3xl bg-white p-6 sm:p-8 ring-1 ring-black/5 shadow-md flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <span className="text-[11px] font-semibold uppercase tracking-luxe text-gold">
                Selected Voucher
              </span>
              <h3 className="font-serif text-2xl sm:text-3xl text-ink font-medium mt-1">
                {POINTS_REDEMPTION[selectedPointsTier].discount} Voucher Code
              </h3>
              <p className="text-xs sm:text-sm text-stone mt-1 max-w-lg">
                Requires {POINTS_REDEMPTION[selectedPointsTier].points} points. Applied instantly at checkout against any LETTY cosmetic or accessory piece.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
              <div className="w-full sm:w-auto rounded-full bg-secondary/80 px-6 py-3 text-center font-mono text-sm font-semibold tracking-wider text-ink ring-1 ring-stone/20">
                {POINTS_REDEMPTION[selectedPointsTier].code}
              </div>
              <Link
                href="/shop"
                className="w-full sm:w-auto inline-flex items-center justify-center rounded-full bg-ink px-8 py-3 text-xs font-semibold uppercase tracking-luxe text-ivory shadow-sm transition-all hover:bg-gold hover:text-ink"
              >
                Shop To Redeem
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 5. VIP TIER STATUS COMPARISON TABLE */}
      <section className="relative w-full py-20 px-4 sm:px-6 md:px-8 lg:px-12">
        <div className="mx-auto max-w-6xl">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <p className="text-xs font-semibold uppercase tracking-luxe text-gold mb-2">
              Ascend The Circle
            </p>
            <h2 className="font-serif text-3xl sm:text-4xl font-normal uppercase tracking-[0.14em] text-ink">
              VIP TIER STATUS
            </h2>
            <span aria-hidden className="rule-gold mx-auto my-4 block h-px w-20" />
            <p className="text-xs sm:text-sm text-stone font-light leading-relaxed">
              Your loyalty is rewarded at every milestone with elevated points multipliers and exclusive allocations.
            </p>
          </div>

          {/* Desktop & Tablet Table */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
            {TIERS.map((tier) => (
              <div
                key={tier.name}
                className={`relative flex flex-col rounded-3xl p-7 sm:p-8 transition-all duration-300 ${
                  tier.highlight
                    ? "bg-ink text-ivory shadow-2xl ring-2 ring-gold md:-translate-y-2"
                    : "bg-white text-ink shadow-sm ring-1 ring-black/5"
                }`}
              >
                {tier.highlight && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 rounded-full bg-gold px-4 py-1 text-[10px] font-semibold uppercase tracking-luxe text-ink shadow-sm">
                    Most Popular Tier
                  </div>
                )}

                <div className="mb-6">
                  <span className={`text-[10px] font-semibold uppercase tracking-luxe ${tier.highlight ? "text-gold" : "text-stone"}`}>
                    {tier.badge}
                  </span>
                  <h3 className="font-serif text-2xl font-semibold uppercase tracking-wider mt-1 mb-2">
                    {tier.name}
                  </h3>
                  <div className="flex items-baseline gap-2 mb-3">
                    <span className="text-xl font-bold font-serif">{tier.spend}</span>
                    <span className={`text-xs font-medium uppercase tracking-wider ${tier.highlight ? "text-gold" : "text-stone"}`}>
                      · {tier.pointsMultiplier}
                    </span>
                  </div>
                  <p className={`text-xs leading-relaxed ${tier.highlight ? "text-ivory/80" : "text-stone"}`}>
                    {tier.description}
                  </p>
                </div>

                <div className={`h-px w-full my-4 ${tier.highlight ? "bg-white/10" : "bg-stone/10"}`} />

                <ul className="flex-1 space-y-3.5 mb-8">
                  {tier.perks.map((perk, pIdx) => (
                    <li key={pIdx} className="flex items-start gap-3 text-xs leading-snug">
                      <Check className={`h-4 w-4 shrink-0 mt-0.5 ${tier.highlight ? "text-gold" : "text-ink"}`} />
                      <span className={tier.highlight ? "text-ivory/90" : "text-stone"}>{perk}</span>
                    </li>
                  ))}
                </ul>

                <a
                  href="#join-section"
                  className={`inline-flex items-center justify-center rounded-full py-3.5 text-xs font-semibold uppercase tracking-luxe transition-all duration-300 ${
                    tier.highlight
                      ? "bg-gold text-ink hover:bg-white shadow-[0_8px_20px_rgba(169,138,95,0.4)]"
                      : "bg-ink text-ivory hover:bg-gold hover:text-ink shadow-sm"
                  }`}
                >
                  Join This Tier
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 6. WAYS TO EARN POINTS */}
      <section className="relative w-full bg-secondary/40 py-16 px-4 sm:py-20 sm:px-6 md:px-8 lg:px-12 border-y border-stone/15">
        <div className="mx-auto max-w-6xl">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <p className="text-xs font-semibold uppercase tracking-luxe text-gold mb-2">
              Accelerate Your Balance
            </p>
            <h2 className="font-serif text-3xl sm:text-4xl font-normal uppercase tracking-[0.14em] text-ink">
              WAYS TO EARN POINTS
            </h2>
            <p className="text-xs sm:text-sm text-stone mt-2">
              Simple ways to build your Atelier Points balance even before placing an order.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {WAYS_TO_EARN.map((item, idx) => {
              const IconComp = item.icon;
              return (
                <div
                  key={idx}
                  className="flex items-start gap-4 rounded-3xl bg-white p-6 shadow-xs ring-1 ring-black/5 transition-all duration-300 hover:shadow-md hover:-translate-y-0.5"
                >
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-secondary text-gold">
                    <IconComp className="h-5 w-5" />
                  </div>
                  <div>
                    <span className="inline-block rounded-full bg-gold/15 px-2.5 py-0.5 text-[11px] font-bold tracking-wider text-ink mb-1.5">
                      {item.points}
                    </span>
                    <h4 className="font-serif text-sm font-semibold uppercase tracking-wider text-ink">
                      {item.title}
                    </h4>
                    <p className="text-xs text-stone leading-relaxed mt-1">
                      {item.desc}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 7. REFER A FRIEND (SHARE £10, GET 100 POINTS) */}
      <section className="relative w-full py-16 px-4 sm:py-24 sm:px-6 md:px-8 lg:px-12">
        <div className="mx-auto max-w-5xl overflow-hidden rounded-[32px] bg-ink text-ivory shadow-2xl ring-1 ring-white/10">
          <div className="grid grid-cols-1 md:grid-cols-2">
            {/* Left Column: Editorial Image */}
            <div className="relative min-h-[340px] md:min-h-full w-full">
              <Image
                src="/ima/IMG_6090.JPG.jpeg"
                alt="Share Letty Beauty with Friends"
                fill
                sizes="(max-width: 768px) 100vw, 50vw"
                className="object-cover object-[center_30%]"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-ink via-transparent to-transparent md:bg-gradient-to-r md:from-transparent md:to-ink" />
            </div>

            {/* Right Column: Referral Action */}
            <div className="p-8 sm:p-10 lg:p-12 flex flex-col justify-center">
              <span className="text-[11px] font-semibold uppercase tracking-luxe text-gold mb-2">
                Patron Referral Program
              </span>
              <h3 className="font-serif text-3xl sm:text-4xl text-ivory font-normal uppercase tracking-wider mb-4 leading-tight">
                SHARE £10, <br />
                <span className="text-gold italic font-light">GET 100 POINTS</span>
              </h3>
              <p className="text-xs sm:text-sm text-ivory/80 font-light leading-relaxed mb-8">
                Gift £10 to a friend towards their first LETTY order of £40+. Once their order is dispatched, 100 Atelier Points will automatically be deposited into your account.
              </p>

              {/* Referral Link Copy Bar */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                <div className="flex-1 rounded-full bg-white/10 backdrop-blur-md px-5 py-3 text-xs font-mono text-ivory/90 ring-1 ring-white/20 truncate">
                  https://letty.com/vip?ref=CIRCLE10
                </div>
                <button
                  type="button"
                  onClick={handleCopyReferral}
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-gold px-6 py-3 text-xs font-semibold uppercase tracking-luxe text-ink transition-all duration-300 hover:bg-white active:scale-95"
                >
                  {copiedReferral ? (
                    <>
                      <Check className="h-3.5 w-3.5 text-ink" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5 text-ink" />
                      <span>Copy Link</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 8. QUICK JOIN / REGISTER INLINE SECTION */}
      <section id="join-section" className="relative w-full bg-secondary/30 py-16 px-4 sm:py-20 sm:px-6 md:px-8 lg:px-12 border-t border-stone/15">
        <div className="mx-auto max-w-xl text-center">
          <div className="inline-flex items-center justify-center rounded-full bg-ink/5 p-3 text-gold mb-4">
            <Crown className="h-6 w-6" />
          </div>
          <h2 className="font-serif text-3xl sm:text-4xl font-normal uppercase tracking-wider text-ink mb-3">
            ENROLL IN THE INNER CIRCLE
          </h2>
          <p className="text-xs sm:text-sm text-stone leading-relaxed mb-8">
            Create your account today to instantly unlock 50 welcome Atelier Points, early archive drops, and birthday gifting.
          </p>

          {joinedSuccess ? (
            <div className="rounded-3xl bg-white p-8 ring-1 ring-gold/40 shadow-lg text-center">
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-gold/20 text-gold mb-3">
                <Check className="h-6 w-6" />
              </div>
              <h3 className="font-serif text-xl font-semibold uppercase text-ink">
                Welcome to The Circle
              </h3>
              <p className="text-xs text-stone mt-2 mb-6">
                Your VIP account dossier has been created. 50 welcome Atelier Points are waiting in your profile.
              </p>
              <Link
                href="/shop"
                className="inline-flex items-center justify-center rounded-full bg-ink px-8 py-3 text-xs font-semibold uppercase tracking-luxe text-ivory hover:bg-gold hover:text-ink transition-colors"
              >
                Begin Shopping
              </Link>
            </div>
          ) : (
            <form onSubmit={handleJoinSubmit} className="flex flex-col sm:flex-row items-center gap-3">
              <input
                type="email"
                value={joinEmail}
                onChange={(e) => setJoinEmail(e.target.value)}
                placeholder="Enter your private email address"
                required
                className="w-full rounded-full bg-white px-6 py-3.5 text-xs text-ink placeholder:text-stone/60 ring-1 ring-black/10 focus:outline-none focus:ring-2 focus:ring-gold"
              />
              <button
                type="submit"
                className="w-full sm:w-auto shrink-0 rounded-full bg-ink px-8 py-3.5 text-xs font-semibold uppercase tracking-luxe text-ivory shadow-md transition-all hover:bg-gold hover:text-ink cursor-pointer"
              >
                Join Now
              </button>
            </form>
          )}
        </div>
      </section>

      {/* 9. VIP FAQS (Accordion) */}
      <section className="relative w-full py-16 px-4 sm:py-24 sm:px-6 md:px-8 lg:px-12">
        <div className="mx-auto max-w-3xl">
          <div className="text-center mb-12">
            <p className="text-xs font-semibold uppercase tracking-luxe text-gold mb-2">
              Client Guidance
            </p>
            <h2 className="font-serif text-2xl sm:text-3xl font-normal uppercase tracking-wider text-ink">
              FREQUENTLY ASKED QUESTIONS
            </h2>
          </div>

          <div className="space-y-4">
            {FAQS.map((faq, idx) => {
              const isOpen = openFaq === idx;
              return (
                <div
                  key={idx}
                  className="rounded-2xl bg-white ring-1 ring-black/5 overflow-hidden transition-all duration-300"
                >
                  <button
                    type="button"
                    onClick={() => setOpenFaq(isOpen ? null : idx)}
                    className="flex w-full items-center justify-between p-5 text-left text-xs sm:text-sm font-serif font-medium uppercase tracking-wider text-ink cursor-pointer"
                  >
                    <span>{faq.q}</span>
                    <ChevronDown
                      className={`h-4 w-4 shrink-0 text-stone transition-transform duration-300 ${
                        isOpen ? "rotate-180 text-ink" : ""
                      }`}
                    />
                  </button>

                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3, ease: EASE_LUXURY }}
                        className="overflow-hidden"
                      >
                        <div className="border-t border-stone/10 px-5 pt-3 pb-5 text-xs text-stone font-light leading-relaxed">
                          {faq.a}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}
