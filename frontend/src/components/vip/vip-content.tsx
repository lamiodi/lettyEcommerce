"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Crown, Gift, Check, Copy, ChevronDown, Lock, LogIn } from "lucide-react";
import { toast } from "sonner";
import { useCustomerAuthStore } from "@/lib/store/customer-auth";
import { useHydrated } from "@/hooks/use-hydrated";
import { EASE_LUXURY } from "@/lib/motion";

const FAQS = [
  { q: "Does signing up create an account?", a: "No. Joining the email list subscribes you to LETTY product news and offers. Create an account or sign in separately to manage your orders." },
  { q: "How does CIRCLE10 work?", a: "Signed-in customers can use CIRCLE10 for 10% off an eligible order of £40 or more, once per customer. Checkout confirms eligibility before payment." },
  { q: "Can I earn or redeem points?", a: "Points, tier upgrades and birthday rewards are not currently available. Any future rewards programme will have its own published terms." },
  { q: "Can I unsubscribe?", a: "Yes. Use the unsubscribe link in a LETTY updates email. Essential messages about your orders will still be sent." },
];

export function VipContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const referralRef = searchParams.get("ref") === "CIRCLE10" ? "CIRCLE10" : null;

  const hydrated = useHydrated();
  const customer = useCustomerAuthStore((s) => s.customer);
  const isLoggedIn = hydrated && Boolean(customer);

  const [copiedReferral, setCopiedReferral] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [joinEmail, setJoinEmail] = useState("");
  const [joinedSuccess, setJoinedSuccess] = useState(false);
  const [joining, setJoining] = useState(false);

  const handleCopyReferral = async () => {
    if (!isLoggedIn) {
      toast.error("Sign in to access the CIRCLE10 member offer.");
      router.push("/login?redirect=/vip#referral-section");
      return;
    }
    const origin = typeof window !== "undefined" && window.location.origin ? window.location.origin : "https://www.houseofletty.com";
    const refUrl = `${origin}/vip?ref=CIRCLE10`;
    try {
      await navigator.clipboard.writeText(refUrl);
      setCopiedReferral(true);
      toast.success("Offer link copied to clipboard!");
      setTimeout(() => setCopiedReferral(false), 2500);
    } catch {
      toast.error("Could not copy the link. Please try again.");
    }
  };

  const handleJoinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinEmail.trim() || joining) return;
    // The Inner Circle list is a newsletter signup, NOT an account — only
    // /login creates auth state. Writing to the customer store here used to
    // fake a logged-in session (breaking the sign-in form and patron gates).
    setJoining(true);
    try {
      const response = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: joinEmail.trim(), source: "vip" }),
        signal: AbortSignal.timeout(15_000),
      });
      if (!response.ok) throw new Error("subscription_failed");
      setJoinedSuccess(true);
      toast.success("You’re subscribed to LETTY updates.");
    } catch {
      toast.error("We couldn’t subscribe you. Please try again.");
    } finally {
      setJoining(false);
    }
  };

  return (
    <div className="w-full bg-ivory text-ink selection:bg-gold/20 selection:text-ink">
      {/* INCOMING REFERRAL INVITATION BANNER */}
      {referralRef && (
        <div className="relative z-20 w-full bg-[#8C6D32] text-ivory py-2.5 px-4 sm:px-6 shadow-md border-b border-black/10">
          <div className="mx-auto max-w-6xl flex flex-col sm:flex-row items-center justify-between gap-2.5 text-xs">
            <div className="flex items-center gap-2.5 text-center sm:text-left">
              <Gift className="h-4 w-4 shrink-0 text-ivory" />
              <span>
                <strong>VIP Offer:</strong> Use <strong className="font-mono bg-black/20 px-1.5 py-0.5 rounded">{referralRef}</strong> for <strong>10% off</strong> an eligible order of £40 or more. Sign-in is required. One use per customer; checkout confirms eligibility.
              </span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Link
                href="/shop"
                className="rounded-full bg-ink text-ivory px-4 py-1 text-[11px] font-semibold uppercase tracking-wider hover:bg-white hover:text-ink transition"
              >
                Shop Collection
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* 1. HERO SECTION (Huda Beauty VIP Hero Structure) */}
      <section className="relative w-full overflow-hidden bg-neutral-900 min-h-[520px] h-[78vh] max-h-[660px] sm:h-[620px] md:h-[680px]">
        {/* Full-Bleed Editorial Visual */}
        <div className="absolute inset-0 z-0">
          <Image
            src="/ima/IMG_6999.PNG"
            alt="Join Letty's VIPs"
            fill
            priority
            sizes="100vw"
            className="object-cover object-[center_20%] sm:object-[center_28%]"
          />
          {/* Subtle bottom vignette scrim ensuring razor-sharp contrast for text & CTA */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 via-45% to-transparent pointer-events-none" />
        </div>

        {/* Anchored Bottom-Left Content */}
        <div className="absolute inset-x-0 bottom-7 sm:bottom-10 md:bottom-14 z-10 px-5 sm:px-8 md:px-12">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: EASE_LUXURY }}
            className="max-w-xl text-left flex flex-col items-start gap-3 sm:gap-4"
          >
            <h1 className="font-sans font-black text-3xl sm:text-5xl md:text-6xl uppercase tracking-tight text-white leading-none drop-shadow-[0_2px_12px_rgba(0,0,0,0.7)]">
              JOIN LETTY&apos;S VIPS
            </h1>

            <a
              href={isLoggedIn ? "#referral-section" : "#join-section"}
              className="inline-flex items-center justify-center rounded-full bg-[#E01E79] hover:bg-[#c41566] text-white px-8 sm:px-10 py-3.5 sm:py-4 text-xs sm:text-sm font-bold uppercase tracking-wider transition-all duration-200 active:scale-95 shadow-[0_4px_20px_rgba(224,30,121,0.45)]"
            >
              {isLoggedIn ? "VIEW MEMBER OFFER" : "GET LETTY UPDATES"}
            </a>
          </motion.div>
        </div>
      </section>

      {/* 2. HOW IT WORKS (3-Step Editorial Ribbon) */}
      <section className="relative w-full border-y border-stone/15 bg-white/50 py-8 sm:py-12 px-4 sm:px-6 lg:px-12 backdrop-blur-xs">
        <div className="mx-auto max-w-6xl">
          <p className="text-center text-xs font-semibold uppercase tracking-luxe text-gold mb-5 sm:mb-8">
            Stay Close to LETTY
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-6 lg:gap-8">
            <div className="flex items-center gap-3.5 sm:gap-4 rounded-2xl bg-ivory/80 p-3.5 sm:p-5 ring-1 ring-stone/10 shadow-xs">
              <span className="flex h-8 w-8 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-full bg-ink text-gold font-serif text-sm sm:text-base font-semibold">
                1
              </span>
              <div>
                <h4 className="font-serif text-xs sm:text-sm uppercase tracking-wider font-semibold text-ink">
                  Join The Circle
                </h4>
                <p className="text-[11px] sm:text-xs text-stone leading-relaxed mt-0.5">
                  Sign up for product news and offers from LETTY.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3.5 sm:gap-4 rounded-2xl bg-ivory/80 p-3.5 sm:p-5 ring-1 ring-stone/10 shadow-xs">
              <span className="flex h-8 w-8 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-full bg-ink text-gold font-serif text-sm sm:text-base font-semibold">
                2
              </span>
              <div>
                <h4 className="font-serif text-xs sm:text-sm uppercase tracking-wider font-semibold text-ink">
                  Discover Your Favourites
                </h4>
                <p className="text-[11px] sm:text-xs text-stone leading-relaxed mt-0.5">
                  Explore lip colour, lash essentials and everyday lip care.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3.5 sm:gap-4 rounded-2xl bg-ivory/80 p-3.5 sm:p-5 ring-1 ring-stone/10 shadow-xs">
              <span className="flex h-8 w-8 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-full bg-ink text-gold font-serif text-sm sm:text-base font-semibold">
                3
              </span>
              <div>
                <h4 className="font-serif text-xs sm:text-sm uppercase tracking-wider font-semibold text-ink">
                  Use Your Member Offer
                </h4>
                <p className="text-[11px] sm:text-xs text-stone leading-relaxed mt-0.5">
                  Sign in and use CIRCLE10 on an eligible order of £40 or more.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Member offer */}
      <section id="referral-section" className="relative w-full py-10 sm:py-20 lg:py-24 px-4 sm:px-6 md:px-8 lg:px-12 scroll-mt-20">
        <div className="mx-auto max-w-5xl overflow-hidden rounded-2xl sm:rounded-[32px] bg-ink text-ivory shadow-2xl ring-1 ring-white/10">
          <div className="grid grid-cols-1 md:grid-cols-2">
            {/* Left Column: Editorial Image */}
            <div className="relative min-h-[180px] sm:min-h-[260px] md:min-h-full w-full">
              <Image
                src="/ima/IMG_6090.webp"
                alt="Share Letty Beauty with Friends"
                fill
                sizes="(max-width: 768px) 100vw, 50vw"
                className="object-cover object-[center_30%]"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-ink via-transparent to-transparent md:bg-gradient-to-r md:from-transparent md:to-ink" />
            </div>

            {/* Right Column: Referral Action */}
            <div className="p-6 sm:p-10 lg:p-12 flex flex-col justify-center">
              {isLoggedIn ? (
                <div>
                  <div className="inline-flex items-center gap-2 rounded-full bg-gold/15 border border-gold/30 px-3 py-1 max-w-full text-[10.5px] sm:text-[11px] font-semibold text-gold mb-3">
                    <Crown className="h-3 w-3 text-gold" />
                    <span className="min-w-0 break-words">Welcome, {customer?.firstName || customer?.email}</span>
                  </div>
                  <span className="block text-[10.5px] sm:text-[11px] font-semibold uppercase tracking-luxe text-gold mb-1">
                    LETTY Member Offer
                  </span>
                  <h3 className="font-serif text-2xl sm:text-3xl sm:text-4xl text-ivory font-normal uppercase tracking-wider mb-3 sm:mb-4 leading-tight">
                    SHARE 10% OFF <br />
                    <span className="text-gold italic font-light">WITH CIRCLE10</span>
                  </h3>
                  <p className="text-xs sm:text-sm text-ivory/80 font-light leading-relaxed mb-5 sm:mb-6">
                    Share CIRCLE10 for 10% off an eligible order of £40 or more. Sign-in is required. One use per customer; checkout confirms eligibility.
                  </p>

                  <div className="space-y-3">
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 sm:gap-3">
                      <div className="flex-1 rounded-full bg-white/10 backdrop-blur-md px-4 sm:px-5 py-2.5 sm:py-3 text-xs font-mono text-ivory/90 ring-1 ring-white/20 truncate flex items-center justify-between">
                        <span className="truncate">https://www.houseofletty.com/vip?ref=CIRCLE10</span>
                      </div>
                      <button
                        type="button"
                        onClick={handleCopyReferral}
                        className="inline-flex items-center justify-center gap-2 rounded-full bg-gold px-5 sm:px-6 py-2.5 sm:py-3 text-xs font-semibold uppercase tracking-luxe text-ink transition-all duration-300 hover:bg-white active:scale-95 cursor-pointer shadow-md"
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
                    <p className="text-[10.5px] sm:text-[11px] text-ivory/60 italic">
                      CIRCLE10 is a shared member offer. This link does not create a personal referral credit or award points.
                    </p>
                  </div>
                </div>
              ) : (
                <div>
                  <div className="inline-flex items-center gap-1.5 rounded-full bg-white/10 border border-white/15 px-3 py-1 text-[10.5px] sm:text-[11px] font-semibold uppercase tracking-wider text-ivory/70 mb-3">
                    <Lock className="h-3 w-3 text-gold" />
                    <span>Patrons Only · Authentication Required</span>
                  </div>
                  <span className="block text-[10.5px] sm:text-[11px] font-semibold uppercase tracking-luxe text-gold mb-1">
                    LETTY Member Offer
                  </span>
                  <h3 className="font-serif text-2xl sm:text-3xl sm:text-4xl text-ivory font-normal uppercase tracking-wider mb-3 sm:mb-4 leading-tight">
                    SHARE 10% OFF <br />
                    <span className="text-gold italic font-light">WITH CIRCLE10</span>
                  </h3>
                  <p className="text-xs sm:text-sm text-ivory/80 font-light leading-relaxed mb-5 sm:mb-6">
                    Share CIRCLE10 for 10% off an eligible order of £40 or more. Sign-in is required. One use per customer; checkout confirms eligibility.
                  </p>

                  <div className="rounded-2xl bg-white/[0.04] border border-white/10 p-4 sm:p-5 space-y-3.5 sm:space-y-4 backdrop-blur-sm">
                    <div className="flex items-start gap-3">
                      <div className="flex h-7 w-7 sm:h-8 sm:w-8 shrink-0 items-center justify-center rounded-full bg-gold/15 text-gold mt-0.5">
                        <Lock className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                      </div>
                      <div>
                        <h4 className="text-xs font-semibold uppercase tracking-wider text-ivory">
                          Exclusive to Logged-in Patrons
                        </h4>
                        <p className="text-[11px] sm:text-xs text-ivory/70 leading-relaxed mt-0.5 sm:mt-1">
                          Sign in to access the CIRCLE10 member offer and share it with a friend. Eligibility is checked at checkout.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between rounded-full bg-white/5 px-4 py-2 text-xs font-mono text-ivory/40 ring-1 ring-white/10 select-none">
                      <span className="truncate tracking-wider">https://www.houseofletty.com/vip?ref=••••••••</span>
                      <span className="text-[10px] uppercase tracking-wider text-gold font-sans font-semibold shrink-0 ml-2">Locked</span>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-2.5 pt-1">
                      <Link
                        href="/login?redirect=/vip#referral-section"
                        className="flex-1 inline-flex items-center justify-center gap-2 rounded-full bg-gold px-5 py-2.5 text-xs font-semibold uppercase tracking-luxe text-ink transition-all hover:bg-white active:scale-95 shadow-sm"
                      >
                        <LogIn className="h-3.5 w-3.5" />
                        <span>Sign In to Access</span>
                      </Link>
                      <a
                        href="#join-section"
                        className="flex-1 inline-flex items-center justify-center gap-2 rounded-full border border-white/20 bg-white/5 px-5 py-2.5 text-xs font-semibold uppercase tracking-luxe text-ivory transition-all hover:bg-white/10 active:scale-95"
                      >
                        <span>Get Updates</span>
                      </a>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* 8. QUICK JOIN / REGISTER INLINE SECTION */}
      <section id="join-section" className="relative w-full bg-secondary/30 py-10 sm:py-16 lg:py-20 px-4 sm:px-6 md:px-8 lg:px-12 border-t border-stone/15 scroll-mt-20">
        <div className="mx-auto max-w-xl text-center">
          <div className="inline-flex items-center justify-center rounded-full bg-ink/5 p-2.5 sm:p-3 text-gold mb-3 sm:mb-4">
            <Crown className="h-5 w-5 sm:h-6 sm:w-6" />
          </div>
          <h2 className="font-serif text-2xl sm:text-3xl sm:text-4xl font-normal uppercase tracking-wider text-ink mb-2 sm:mb-3">
            ENROLL IN THE INNER CIRCLE
          </h2>
          <p className="text-xs sm:text-sm text-stone leading-relaxed mb-6 sm:mb-8">
            Subscribe for LETTY product news and offers. This subscribes you to emails; it does not create a shopping account.
          </p>

          {joinedSuccess ? (
            <div className="rounded-2xl sm:rounded-3xl bg-white p-6 sm:p-8 ring-1 ring-gold/40 shadow-lg text-center">
              <div className="inline-flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-full bg-gold/20 text-gold mb-2.5 sm:mb-3">
                <Check className="h-5 w-5 sm:h-6 sm:w-6" />
              </div>
              <h3 className="font-serif text-lg sm:text-xl font-semibold uppercase text-ink">
                Welcome to The Circle
              </h3>
              <p className="text-xs text-stone mt-1.5 mb-5 sm:mb-6">
                You&apos;re subscribed to LETTY product news and offers.
              </p>
              <Link
                href="/shop"
                className="inline-flex items-center justify-center rounded-full bg-ink px-6 sm:px-8 py-2.5 sm:py-3 text-xs font-semibold uppercase tracking-luxe text-ivory hover:bg-gold hover:text-ink transition-colors"
              >
                Begin Shopping
              </Link>
            </div>
          ) : (
            <>
              <form onSubmit={handleJoinSubmit} className="flex flex-col sm:flex-row items-center gap-2.5 sm:gap-3">
                <input
                  type="email"
                  aria-label="Email address for LETTY updates"
                  disabled={joining}
                  value={joinEmail}
                  onChange={(e) => setJoinEmail(e.target.value)}
                  placeholder="Enter your email address"
                  required
                  className="w-full rounded-full bg-white px-5 sm:px-6 py-3 sm:py-3.5 text-xs text-ink placeholder:text-stone/60 ring-1 ring-black/10 focus:outline-none focus:ring-2 focus:ring-gold"
                />
                <button
                  type="submit"
                  disabled={joining}
                  className="w-full sm:w-auto shrink-0 rounded-full bg-ink px-6 sm:px-8 py-3 sm:py-3.5 text-xs font-semibold uppercase tracking-luxe text-ivory shadow-md transition-all hover:bg-gold hover:text-ink cursor-pointer"
                >
                  {joining ? "Joining..." : "Join Now"}
                </button>
              </form>
              <div className="mt-4 text-center">
                <p className="text-xs text-stone">
                  Already have an account?{" "}
                  <Link
                    href="/login?redirect=/vip"
                    className="font-medium text-ink underline underline-offset-4 hover:text-gold transition-colors"
                  >
                    Sign in to your account
                  </Link>
                </p>
              </div>
            </>
          )}
        </div>
      </section>

      {/* 9. VIP FAQS (Accordion) */}
      <section className="relative w-full py-10 sm:py-20 lg:py-24 px-4 sm:px-6 md:px-8 lg:px-12">
        <div className="mx-auto max-w-3xl">
          <div className="text-center mb-6 sm:mb-12">
            <p className="text-xs font-semibold uppercase tracking-luxe text-gold mb-1.5 sm:mb-2">
              Client Guidance
            </p>
            <h2 className="font-serif text-2xl sm:text-3xl font-normal uppercase tracking-wider text-ink">
              FREQUENTLY ASKED QUESTIONS
            </h2>
          </div>

          <div className="space-y-3 sm:space-y-4">
            {FAQS.map((faq, idx) => {
              const isOpen = openFaq === idx;
              return (
                <div
                  key={idx}
                  className="rounded-xl sm:rounded-2xl bg-white ring-1 ring-black/5 overflow-hidden transition-all duration-300"
                >
                  <button
                    type="button"
                    aria-expanded={isOpen}
                    aria-controls={`vip-faq-${idx}`}
                    onClick={() => setOpenFaq(isOpen ? null : idx)}
                    className="flex w-full items-center justify-between p-4 sm:p-5 text-left text-xs sm:text-sm font-serif font-medium uppercase tracking-wider text-ink cursor-pointer"
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
                        id={`vip-faq-${idx}`}
                        className="overflow-hidden"
                      >
                        <div className="border-t border-stone/10 px-4 pt-2.5 pb-4 sm:px-5 sm:pt-3 sm:pb-5 text-xs text-stone font-light leading-relaxed">
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
