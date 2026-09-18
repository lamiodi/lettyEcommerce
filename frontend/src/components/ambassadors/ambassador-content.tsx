"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Sparkles,
  ArrowUpRight,
  Check,
  Gift,
  DollarSign,
  Globe,
  Share2,
  Play,
} from "lucide-react";
import { EASE_LUXURY } from "@/lib/motion";
import { DEFAULT_UGC_VIDEOS } from "@/lib/data/ugc-videos";

const PROGRAM_STEPS = [
  {
    step: "01",
    title: "SUBMIT YOUR APPLICATION",
    desc: "Begin your journey with LETTY by sharing your social presence, portfolio, and creative vision through our considered ambassador application.",
  },
  {
    step: "02",
    title: "RECEIVE YOUR PR SUITE",
    desc: "Selected Ambassadors will receive a curated Letty welcome suite, featuring signature creations, first access to unreleased lab samples, and a bespoke code to share with your community.",
  },
  {
    step: "03",
    title: "CREATE, SHARE & EARN",
    desc: "Share your authentic Letty ritual with your community and introduce them to the world of Letty. Earn up to 15% commission on every order, alongside exclusive campaign bonuses.",
  },
];

const PERKS = [
  {
    icon: DollarSign,
    badge: "10% – 15%",
    title: "Tiered Commissions",
    desc: "Earn competitive commissions on every referred order with real-time reporting and monthly direct deposit.",
  },
  {
    icon: Gift,
    badge: "Full-Size PR",
    title: "Exclusive PR Suites",
    desc: "Receive complimentary seasonal launches, limited-edition sets, and private lab formulas delivered to your door.",
  },
  {
    icon: Globe,
    badge: "Global Reach",
    title: "Editorial Spotlight",
    desc: "Get featured across LETTY's official digital channels, editorial journal, email campaigns, and retail screens.",
  },
  {
    icon: Share2,
    badge: "Bespoke Code",
    title: "Audience Privileges",
    desc: "Empower your community with an exclusive 10% discount code, bespoke gift vouchers, and giveaway sponsorships.",
  },
];

const MATCH_CRITERIA = [
  "You are passionate about quiet luxury beauty and clean, cruelty-free cosmetic formulations.",
  "You create high-quality, authentic video content (makeup tutorials, shade swatches, skin rituals, GRWMs).",
  "You maintain an active and engaged presence on Instagram, TikTok, or YouTube.",
  "Your aesthetic resonates with understated elegance, elevated craftsmanship, and modern glamour.",
];

export function AmbassadorContent() {
  const [activeVideoModal, setActiveVideoModal] = useState<string | null>(null);
  const videoRefs = useRef<Array<HTMLVideoElement | null>>([]);
  const tileRefs = useRef<Array<HTMLDivElement | null>>([]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const idx = tileRefs.current.indexOf(entry.target as HTMLDivElement);
          if (idx === -1) return;
          const video = videoRefs.current[idx];
          if (!video) return;

          if (entry.isIntersecting) {
            video.muted = true;
            video.defaultMuted = true;
            const playPromise = video.play();
            if (playPromise && typeof playPromise.catch === "function") {
              playPromise.catch(() => {});
            }
          } else {
            video.pause();
          }
        });
      },
      {
        root: null,
        rootMargin: "80px 0px 80px 0px",
        threshold: 0.1,
      },
    );

    tileRefs.current.forEach((tile) => {
      if (tile) observer.observe(tile);
    });

    return () => observer.disconnect();
  }, []);

  return (
    <div className="w-full bg-ivory text-ink selection:bg-gold/20 selection:text-ink">
      {/* 1. HERO SECTION */}
      <section className="relative w-full overflow-hidden bg-ink py-12 px-4 sm:py-24 sm:px-6 md:px-8 lg:py-32 lg:px-12">
        <div className="absolute inset-0 z-0">
          <Image
            src="/ima/IMG_7017.JPG (1).jpeg"
            alt="Letty Beauty Global Ambassadors"
            fill
            priority
            sizes="100vw"
            className="object-cover object-[center_30%] opacity-55 scale-105 transition-transform duration-1000"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/65 to-ink/40" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(26,20,18,0.7)_100%)]" />
        </div>

        <div className="relative z-10 mx-auto max-w-4xl text-center">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: EASE_LUXURY }}
          >
            <div className="inline-flex items-center gap-2 rounded-full bg-ivory/10 backdrop-blur-md px-3.5 py-1 sm:px-4 sm:py-1.5 text-[11px] sm:text-xs font-medium uppercase tracking-luxe text-gold ring-1 ring-gold/30 mb-4 sm:mb-6">
              <Sparkles className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-gold" />
              <span>Letty Creator Atelier · Global Program</span>
            </div>

            <h1 className="font-serif text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-normal uppercase tracking-[0.14em] text-ivory mb-4 sm:mb-6 leading-[1.1]">
              WELCOME TO <br />
              LETTY&apos;S <span className="text-gold italic font-light">AMBASSADORS</span>
            </h1>

            <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4">
              <Link
                href="/ambassadors/apply"
                className="group inline-flex items-center justify-center gap-2 rounded-full bg-gold px-6 sm:px-10 py-3 sm:py-4 text-xs sm:text-sm font-semibold uppercase tracking-luxe text-ink shadow-[0_8px_30px_rgba(169,138,95,0.4)] transition-all duration-300 hover:bg-[#bfa073] hover:-translate-y-0.5"
              >
                <span>Apply For Atelier Access</span>
                <ArrowUpRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </Link>

              <a
                href="#perks-section"
                className="inline-flex items-center justify-center rounded-full bg-ivory/10 backdrop-blur-md px-6 sm:px-10 py-3 sm:py-4 text-xs sm:text-sm font-semibold uppercase tracking-luxe text-ivory ring-1 ring-white/20 transition-all duration-300 hover:bg-ivory/20 hover:text-white"
              >
                Discover Perks
              </a>
            </div>
          </motion.div>
        </div>
      </section>

      {/* 2. ABOUT THE PROGRAM (3-Step Timeline) */}
      <section className="relative w-full border-y border-stone/15 bg-white/50 py-8 sm:py-16 px-4 sm:px-6 lg:px-12 backdrop-blur-xs">
        <div className="mx-auto max-w-6xl">
          <div className="text-center max-w-2xl mx-auto mb-6 sm:mb-12">
            <p className="text-xs font-semibold uppercase tracking-luxe text-gold mb-2">
              THE AMBASSADOR JOURNEY
            </p>
            <h2 className="font-serif text-2xl sm:text-3xl md:text-4xl font-normal uppercase tracking-[0.14em] text-ink">
              ABOUT THE PROGRAM
            </h2>
            <p className="text-xs sm:text-sm text-stone mt-1.5 sm:mt-2">
              A considered partnership designed to celebrate your creative voice, cultivate meaningful connection, and bring the world of LETTY to your community.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-6 lg:gap-8">
            {PROGRAM_STEPS.map((step) => (
              <div
                key={step.step}
                className="relative rounded-2xl sm:rounded-3xl bg-ivory p-5 sm:p-8 ring-1 ring-stone/15 shadow-xs transition-all duration-300 hover:shadow-md"
              >
                <span className="font-serif text-2xl sm:text-3xl font-light text-gold mb-2 sm:mb-4 block">
                  {step.step}
                </span>
                <h3 className="font-serif text-base sm:text-lg font-semibold uppercase tracking-wider text-ink mb-1.5 sm:mb-2">
                  {step.title}
                </h3>
                <p className="text-xs sm:text-sm text-stone leading-relaxed">
                  {step.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 3. WHY JOIN LETTY'S AMBASSADORS (4 Value Pillars) */}
      <section id="perks-section" className="relative w-full py-10 sm:py-20 px-4 sm:px-6 md:px-8 lg:px-12">
        <div className="mx-auto max-w-6xl">
          <div className="text-center max-w-2xl mx-auto mb-6 sm:mb-14">
            <h2 className="font-serif text-2xl sm:text-3xl md:text-4xl font-normal uppercase tracking-[0.14em] text-ink">
              WHY JOIN LETTY&apos;S BEAUTIES
            </h2>
            <span aria-hidden className="rule-gold mx-auto my-3 sm:my-4 block h-px w-20" />
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-6">
            {PERKS.map((perk, idx) => {
              const IconComp = perk.icon;
              return (
                <div
                  key={idx}
                  className="group relative flex flex-col rounded-2xl sm:rounded-3xl bg-white p-3.5 sm:p-7 shadow-xs sm:shadow-sm ring-1 ring-black/5 transition-all duration-300 hover:shadow-xl hover:-translate-y-1"
                >
                  <div className="flex items-center justify-between gap-1.5 sm:gap-2 mb-2.5 sm:mb-6">
                    <div className="flex h-8 w-8 sm:h-12 sm:w-12 items-center justify-center rounded-xl sm:rounded-2xl bg-secondary/80 text-gold shrink-0">
                      <IconComp className="h-4 w-4 sm:h-6 sm:w-6" />
                    </div>
                    <span className="rounded-full bg-gold/15 px-2 py-0.5 sm:px-3 sm:py-1 text-[8px] sm:text-[10px] font-bold uppercase tracking-wider text-ink shrink-0 text-center">
                      {perk.badge}
                    </span>
                  </div>

                  <h3 className="font-serif text-xs sm:text-base lg:text-lg font-semibold uppercase tracking-wider text-ink mb-1 sm:mb-2">
                    {perk.title}
                  </h3>
                  <p className="text-[10.5px] sm:text-xs text-stone leading-relaxed flex-1">
                    {perk.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 4. ARE YOU OUR PERFECT MATCH? (Split Criteria Section) */}
      <section className="relative w-full bg-secondary/40 py-10 sm:py-20 px-4 sm:px-6 md:px-8 lg:px-12 border-y border-stone/15">
        <div className="mx-auto max-w-6xl">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-14 items-center">
            {/* Left: Criteria List */}
            <div className="lg:col-span-7">
              <span className="text-xs font-semibold uppercase tracking-luxe text-gold mb-1.5 sm:mb-2 block">
                The Discerning Creator
              </span>
              <h2 className="font-serif text-2xl sm:text-4xl lg:text-5xl font-normal uppercase tracking-wider text-ink mb-4 sm:mb-6 leading-tight">
                ARE YOU OUR <br />
                <span className="text-gold italic font-light">PERFECT MATCH?</span>
              </h2>
              <p className="text-xs sm:text-sm text-stone leading-relaxed mb-5 sm:mb-8 max-w-xl">
                We partner with beauty innovators who care deeply about intentional cosmetics, inclusive formulas, and authentic aesthetic expression.
              </p>

              <div className="space-y-2.5 sm:space-y-4 mb-6 sm:mb-10">
                {MATCH_CRITERIA.map((criterion, idx) => (
                  <div key={idx} className="flex items-start gap-2.5 sm:gap-3.5">
                    <div className="flex h-4.5 w-4.5 sm:h-5 sm:w-5 shrink-0 items-center justify-center rounded-full bg-ink text-gold mt-0.5 shadow-xs">
                      <Check className="h-3 w-3" />
                    </div>
                    <p className="text-xs sm:text-sm text-ink/90 font-medium leading-relaxed">
                      {criterion}
                    </p>
                  </div>
                ))}
              </div>

              <Link
                href="/ambassadors/apply"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-ink px-6 sm:px-8 py-3 sm:py-3.5 text-xs font-semibold uppercase tracking-luxe text-ivory shadow-md transition-all duration-300 hover:bg-gold hover:text-ink"
              >
                <span>Submit Your Application</span>
                <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            {/* Right: Editorial Flatlay Packshot */}
            <div className="lg:col-span-5 relative aspect-[16/9] sm:aspect-[4/3] lg:aspect-[4/5] w-full overflow-hidden rounded-2xl sm:rounded-[32px] bg-ink shadow-xl ring-1 ring-black/10">
              <Image
                src="/ima/IMG_6090.JPG.jpeg"
                alt="Letty Beauty Creator Match"
                fill
                sizes="(max-width: 1023px) 100vw, 40vw"
                className="object-cover object-[center_30%]"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-ink/80 via-transparent to-transparent" />
              <div className="absolute bottom-4 sm:bottom-6 left-4 sm:left-6 right-4 sm:right-6 text-ivory">
                <span className="inline-block rounded-full bg-gold/90 px-2.5 sm:px-3 py-0.5 sm:py-1 text-[9px] sm:text-[10px] font-semibold uppercase tracking-luxe text-ink mb-1 sm:mb-2">
                  Atelier Standard
                </span>
                <p className="font-serif text-xs sm:text-sm italic font-light text-ivory/95">
                  &ldquo;LETTY formulas are designed to look striking on film, effortless in daylight, and transcendent on every complexion.&rdquo;
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. MEET OUR AMBASSADORS (UGC Video Reels - Horizontal Snap on Mobile, 4-Col Grid on Desktop) */}
      <section className="relative w-full py-10 sm:py-20 px-4 sm:px-6 md:px-8 lg:px-12">
        <div className="mx-auto max-w-6xl">
          <div className="text-center max-w-2xl mx-auto mb-6 sm:mb-14">
            <p className="text-xs font-semibold uppercase tracking-luxe text-gold mb-1.5 sm:mb-2">
              Community In Action
            </p>
            <h2 className="font-serif text-2xl sm:text-3xl md:text-4xl font-normal uppercase tracking-[0.14em] text-ink">
              MEET OUR AMBASSADORS
            </h2>
            <span aria-hidden className="rule-gold mx-auto my-3 sm:my-4 block h-px w-20" />
            <p className="text-xs sm:text-sm text-stone font-light leading-relaxed">
              Watch real beauty storytellers create, swatch, and elevate their look with LETTY.
            </p>
          </div>

          {/* Mobile: Horizontal Snap Reels; Desktop: 4-Column Grid */}
          <div className="flex overflow-x-auto snap-x snap-mandatory gap-3 pb-3 no-scrollbar md:grid md:grid-cols-4 md:gap-6 md:pb-0">
            {DEFAULT_UGC_VIDEOS.slice(0, 4).map((ugc, i) => {
              const posterImage = ugc.poster || ugc.productImage || "/ima/IMG_6090.JPG.jpeg";
              return (
                <div
                  key={ugc.id}
                  ref={(el) => {
                    tileRefs.current[i] = el;
                  }}
                  className="group relative aspect-[9/16] w-[68vw] max-w-[220px] shrink-0 snap-center overflow-hidden rounded-2xl sm:rounded-3xl bg-ink shadow-md transition-all duration-300 hover:shadow-xl cursor-pointer md:w-full md:max-w-none"
                  onClick={() => setActiveVideoModal(ugc.src)}
                >
                  <video
                    ref={(el) => {
                      videoRefs.current[i] = el;
                      if (el) {
                        el.muted = true;
                        el.defaultMuted = true;
                      }
                    }}
                    src={ugc.src}
                    poster={posterImage}
                    muted
                    playsInline
                    autoPlay
                    loop
                    preload="auto"
                    className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105 opacity-90 pointer-events-none"
                  />

                  <div className="absolute inset-0 bg-gradient-to-t from-ink/90 via-ink/20 to-transparent pointer-events-none" />

                  {/* Play Button Overlay — reveals on hover */}
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none transition-opacity duration-300 opacity-60 group-hover:opacity-100">
                    <div className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-full bg-ink/40 backdrop-blur-md text-ivory ring-1 ring-white/30 transition-all duration-300 group-hover:scale-110 group-hover:bg-gold group-hover:text-ink shadow-lg">
                      <Play className="h-4 w-4 sm:h-5 sm:w-5 fill-current ml-0.5" />
                    </div>
                  </div>

                  {/* Creator Details */}
                  <div className="absolute bottom-3 sm:bottom-4 left-3 sm:left-4 right-3 sm:right-4 text-ivory pointer-events-none">
                    <span className="text-[9.5px] sm:text-[10px] font-medium tracking-wider text-gold block truncate">
                      {ugc.handle}
                    </span>
                    <h4 className="font-serif text-xs sm:text-sm font-normal truncate mt-0.5">
                      {ugc.caption || ugc.productName}
                    </h4>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 6. CALL TO ACTION BANNER & FAQS LINK */}
      <section className="relative w-full bg-secondary/40 py-12 px-4 sm:py-24 sm:px-6 md:px-8 lg:px-12 border-t border-stone/15 text-center">
        <div className="mx-auto max-w-3xl">
          <div className="inline-flex items-center gap-2 rounded-full bg-ink/5 px-3.5 py-1 sm:px-4 sm:py-1.5 text-[11px] sm:text-xs font-medium uppercase tracking-luxe text-gold mb-4 sm:mb-6 ring-1 ring-gold/20">
            <Sparkles className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-gold" />
            <span>Creator Atelier Membership</span>
          </div>

          <h2 className="font-serif text-2xl sm:text-4xl md:text-5xl font-normal uppercase tracking-[0.14em] text-ink mb-3 sm:mb-4 leading-tight">
            READY TO JOIN THE <br />
            <span className="text-gold italic font-light">AMBASSADOR ATELIER?</span>
          </h2>

          <p className="mx-auto max-w-xl text-xs sm:text-sm md:text-base text-stone font-light leading-relaxed mb-6 sm:mb-10">
            Submit your creator dossier on our application portal to unlock seasonal PR gifting suites, bespoke community discount codes, and tiered commissions.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-2.5 sm:gap-4">
            <Link
              href="/ambassadors/apply"
              className="group inline-flex items-center justify-center gap-2 rounded-full bg-ink px-6 sm:px-10 py-3 sm:py-4 text-xs sm:text-sm font-semibold uppercase tracking-luxe text-ivory shadow-xl transition-all duration-300 hover:bg-gold hover:text-ink hover:-translate-y-0.5"
            >
              <span>Apply Now &amp; View FAQs</span>
              <ArrowUpRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </Link>

            <Link
              href="/ambassadors/apply#faqs-section"
              className="inline-flex items-center justify-center rounded-full bg-white px-6 sm:px-10 py-3 sm:py-4 text-xs sm:text-sm font-semibold uppercase tracking-luxe text-ink ring-1 ring-black/10 transition-all duration-300 hover:bg-ivory hover:ring-gold/40"
            >
              Program FAQs
            </Link>
          </div>
        </div>
      </section>

      {/* Video Modal */}
      {activeVideoModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
          onClick={() => setActiveVideoModal(null)}
        >
          <div
            className="relative max-w-md w-full aspect-[9/16] bg-black rounded-3xl overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <video
              src={activeVideoModal}
              controls
              autoPlay
              className="h-full w-full object-cover"
            />
            <button
              type="button"
              onClick={() => setActiveVideoModal(null)}
              className="absolute top-4 right-4 rounded-full bg-black/60 p-2 text-white hover:bg-black/90 cursor-pointer"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
