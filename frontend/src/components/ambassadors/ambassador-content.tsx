"use client";

import { useState } from "react";
import Image from "next/image";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  ArrowUpRight,
  Check,
  ChevronDown,
  Gift,
  DollarSign,
  Globe,
  Share2,
  Play,
  Send,
  HeartHandshake,
} from "lucide-react";
import { EASE_LUXURY } from "@/lib/motion";
import { DEFAULT_UGC_VIDEOS } from "@/lib/data/ugc-videos";

const PROGRAM_STEPS = [
  {
    step: "01",
    title: "Submit Your Application",
    desc: "Complete our quick creator application with your social handles, portfolio, and creative vision.",
  },
  {
    step: "02",
    title: "Receive Your PR Suite",
    desc: "Approved ambassadors receive an artisanal welcome box, unreleased lab samples, and a bespoke follower code.",
  },
  {
    step: "03",
    title: "Create, Share & Earn",
    desc: "Share your authentic ritual with your community. Earn up to 15% commission on every order plus campaign bonuses.",
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

const FAQS = [
  {
    q: "What are the commission rates and when are payments made?",
    a: "Ambassadors start at a baseline 10% commission on all net sales generated through their unique tracking link or discount code. High-performing creators ascend to our Premier Tier (15% commission + monthly PR gifting bonuses). Payouts are made monthly via direct bank transfer or PayPal.",
  },
  {
    q: "Is there a minimum follower requirement to apply?",
    a: "No. We prioritize engagement rate, aesthetic quality, storytelling ability, and genuine passion for LETTY over raw follower numbers. Nano, micro, and macro creators are all welcomed to apply.",
  },
  {
    q: "What products are included in the welcome PR Gifting Suite?",
    a: "Approved ambassadors receive our signature core ritual including the Velvet Lip Liner set, High-Shine Glass Gloss, and seasonal preview shades tailored to your undertones and skin profile.",
  },
  {
    q: "Do I have to post exclusively for LETTY?",
    a: "Not at all. We celebrate creative freedom. While we love ambassadors who feature LETTY as their signature lip and beauty staple, you are free to partner with other non-conflicting beauty houses.",
  },
  {
    q: "How long does the application review process take?",
    a: "Our Creator Relations Atelier reviews applications weekly. You will receive an email response regarding your application status within 48 to 72 business hours.",
  },
];

export function AmbassadorContent() {
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [activeVideoModal, setActiveVideoModal] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    instagram: "",
    tiktok: "",
    followers: "1k-10k",
    portfolioUrl: "",
    message: "",
  });
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.email.trim()) {
      toast.error("Please provide your name and email address.");
      return;
    }

    setSubmitting(true);
    const messageParts = [
      formData.message.trim(),
      formData.instagram ? `Instagram: @${formData.instagram.trim()}` : null,
      formData.tiktok ? `TikTok: @${formData.tiktok.trim()}` : null,
      formData.followers ? `Audience Size: ${formData.followers}` : null,
      formData.portfolioUrl ? `Portfolio / Media Kit: ${formData.portfolioUrl.trim()}` : null,
    ].filter(Boolean);

    const fullMessage = messageParts.join("\n\n");

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name.trim(),
          email: formData.email.trim(),
          subject: `Brand Ambassador Application: ${formData.name.trim()} (@${formData.instagram || formData.tiktok || "creator"})`,
          message: fullMessage.length >= 10 ? fullMessage : `${fullMessage} (Ambassador application confirmed)`,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error || "Submission failed");
      }

      setFormSubmitted(true);
      toast.success("Application received. Our creator relations team will review your portfolio.");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Submission failed. Please try again.";
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="w-full bg-ivory text-ink selection:bg-gold/20 selection:text-ink">
      {/* 1. HERO SECTION (Inspired by Welcome to Huda's Beauties) */}
      <section className="relative w-full overflow-hidden bg-ink py-20 px-4 sm:py-28 sm:px-6 md:px-8 lg:py-36 lg:px-12">
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
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: EASE_LUXURY }}
          >
            <div className="inline-flex items-center gap-2 rounded-full bg-ivory/10 backdrop-blur-md px-4 py-1.5 text-xs font-medium uppercase tracking-luxe text-gold ring-1 ring-gold/30 mb-6">
              <Sparkles className="h-3.5 w-3.5 text-gold" />
              <span>Letty Creator Atelier · Global Program</span>
            </div>

            <h1 className="font-serif text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-normal uppercase tracking-[0.14em] text-ivory mb-6 leading-[1.1]">
              WELCOME TO <br />
              LETTY&apos;S <span className="text-gold italic font-light">AMBASSADORS</span>
            </h1>

            <p className="mx-auto max-w-2xl text-sm sm:text-base md:text-lg text-ivory/80 font-light leading-relaxed mb-10">
              Your space to create, share &amp; earn. Partner with LETTY as a global beauty storyteller,
              receive seasonal PR suites, and share our artisanal formulas with the world.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-4">
              <a
                href="#apply-form"
                className="group inline-flex items-center justify-center gap-2 rounded-full bg-gold px-8 sm:px-10 py-3.5 sm:py-4 text-xs sm:text-sm font-semibold uppercase tracking-luxe text-ink shadow-[0_8px_30px_rgba(169,138,95,0.4)] transition-all duration-300 hover:bg-[#bfa073] hover:-translate-y-0.5"
              >
                <span>Apply For Atelier Access</span>
                <ArrowUpRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </a>

              <a
                href="#perks-section"
                className="inline-flex items-center justify-center rounded-full bg-ivory/10 backdrop-blur-md px-8 sm:px-10 py-3.5 sm:py-4 text-xs sm:text-sm font-semibold uppercase tracking-luxe text-ivory ring-1 ring-white/20 transition-all duration-300 hover:bg-ivory/20 hover:text-white"
              >
                Discover Perks
              </a>
            </div>
          </motion.div>
        </div>
      </section>

      {/* 2. ABOUT THE PROGRAM (3-Step Timeline) */}
      <section className="relative w-full border-y border-stone/15 bg-white/50 py-16 px-4 sm:px-6 lg:px-12 backdrop-blur-xs">
        <div className="mx-auto max-w-6xl">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <p className="text-xs font-semibold uppercase tracking-luxe text-gold mb-2">
              The Creator Journey
            </p>
            <h2 className="font-serif text-3xl sm:text-4xl font-normal uppercase tracking-[0.14em] text-ink">
              ABOUT THE PROGRAM
            </h2>
            <p className="text-xs sm:text-sm text-stone mt-2">
              A collaborative partnership built to amplify your creative voice.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {PROGRAM_STEPS.map((step) => (
              <div
                key={step.step}
                className="relative rounded-3xl bg-ivory p-8 ring-1 ring-stone/15 shadow-xs transition-all duration-300 hover:shadow-md"
              >
                <span className="font-serif text-3xl font-light text-gold mb-4 block">
                  {step.step}
                </span>
                <h3 className="font-serif text-lg font-semibold uppercase tracking-wider text-ink mb-2">
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
      <section id="perks-section" className="relative w-full py-20 px-4 sm:px-6 md:px-8 lg:px-12">
        <div className="mx-auto max-w-6xl">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <p className="text-xs font-semibold uppercase tracking-luxe text-gold mb-2">
              Creator Privileges
            </p>
            <h2 className="font-serif text-3xl sm:text-4xl font-normal uppercase tracking-[0.14em] text-ink">
              WHY JOIN LETTY&apos;S BEAUTIES
            </h2>
            <span aria-hidden className="rule-gold mx-auto my-4 block h-px w-20" />
            <p className="text-xs sm:text-sm text-stone font-light leading-relaxed">
              We empower our storytellers with industry-leading rewards, seasonal allocations, and direct atelier access.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {PERKS.map((perk, idx) => {
              const IconComp = perk.icon;
              return (
                <div
                  key={idx}
                  className="group relative flex flex-col rounded-3xl bg-white p-7 shadow-sm ring-1 ring-black/5 transition-all duration-300 hover:shadow-xl hover:-translate-y-1"
                >
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-secondary/80 text-gold">
                      <IconComp className="h-6 w-6" />
                    </div>
                    <span className="rounded-full bg-gold/15 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-ink">
                      {perk.badge}
                    </span>
                  </div>

                  <h3 className="font-serif text-lg font-semibold uppercase tracking-wider text-ink mb-2">
                    {perk.title}
                  </h3>
                  <p className="text-xs text-stone leading-relaxed flex-1">
                    {perk.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 4. ARE YOU OUR PERFECT MATCH? (Split Criteria Section) */}
      <section className="relative w-full bg-secondary/40 py-20 px-4 sm:px-6 md:px-8 lg:px-12 border-y border-stone/15">
        <div className="mx-auto max-w-6xl">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
            {/* Left: Criteria List */}
            <div className="lg:col-span-7">
              <span className="text-xs font-semibold uppercase tracking-luxe text-gold mb-2 block">
                The Discerning Creator
              </span>
              <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-normal uppercase tracking-wider text-ink mb-6 leading-tight">
                ARE YOU OUR <br />
                <span className="text-gold italic font-light">PERFECT MATCH?</span>
              </h2>
              <p className="text-xs sm:text-sm text-stone leading-relaxed mb-8 max-w-xl">
                We partner with beauty innovators who care deeply about intentional cosmetics, inclusive formulas, and authentic aesthetic expression.
              </p>

              <div className="space-y-4 mb-10">
                {MATCH_CRITERIA.map((criterion, idx) => (
                  <div key={idx} className="flex items-start gap-3.5">
                    <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-ink text-gold mt-0.5 shadow-xs">
                      <Check className="h-3 w-3" />
                    </div>
                    <p className="text-xs sm:text-sm text-ink/90 font-medium leading-relaxed">
                      {criterion}
                    </p>
                  </div>
                ))}
              </div>

              <a
                href="#apply-form"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-ink px-8 py-3.5 text-xs font-semibold uppercase tracking-luxe text-ivory shadow-md transition-all duration-300 hover:bg-gold hover:text-ink"
              >
                <span>Submit Your Application</span>
                <ArrowUpRight className="h-3.5 w-3.5" />
              </a>
            </div>

            {/* Right: Editorial Flatlay Packshot */}
            <div className="lg:col-span-5 relative aspect-[4/5] w-full overflow-hidden rounded-[32px] bg-ink shadow-xl ring-1 ring-black/10">
              <Image
                src="/ima/IMG_6090.JPG.jpeg"
                alt="Letty Beauty Creator Match"
                fill
                sizes="(max-width: 1023px) 100vw, 40vw"
                className="object-cover object-[center_30%]"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-ink/80 via-transparent to-transparent" />
              <div className="absolute bottom-6 left-6 right-6 text-ivory">
                <span className="inline-block rounded-full bg-gold/90 px-3 py-1 text-[10px] font-semibold uppercase tracking-luxe text-ink mb-2">
                  Atelier Standard
                </span>
                <p className="font-serif text-sm italic font-light text-ivory/95">
                  &ldquo;LETTY formulas are designed to look striking on film, effortless in daylight, and transcendent on every complexion.&rdquo;
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. MEET OUR AMBASSADORS (UGC Video Reels) */}
      <section className="relative w-full py-20 px-4 sm:px-6 md:px-8 lg:px-12">
        <div className="mx-auto max-w-6xl">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <p className="text-xs font-semibold uppercase tracking-luxe text-gold mb-2">
              Community In Action
            </p>
            <h2 className="font-serif text-3xl sm:text-4xl font-normal uppercase tracking-[0.14em] text-ink">
              MEET OUR AMBASSADORS
            </h2>
            <span aria-hidden className="rule-gold mx-auto my-4 block h-px w-20" />
            <p className="text-xs sm:text-sm text-stone font-light leading-relaxed">
              Watch real beauty storytellers create, swatch, and elevate their look with LETTY.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
            {DEFAULT_UGC_VIDEOS.slice(0, 4).map((ugc) => {
              const posterImage = ugc.poster || ugc.productImage || "/ima/IMG_6090.JPG.jpeg";
              return (
                <div
                  key={ugc.id}
                  className="group relative aspect-[9/16] w-full overflow-hidden rounded-2xl sm:rounded-3xl bg-ink shadow-md transition-all duration-300 hover:shadow-xl cursor-pointer"
                  onClick={() => setActiveVideoModal(ugc.src)}
                >
                  <Image
                    src={posterImage}
                    alt={ugc.caption || ugc.productName}
                    fill
                    sizes="(max-width: 640px) 50vw, 25vw"
                    className="object-cover object-center transition-transform duration-500 group-hover:scale-105 opacity-90"
                  />

                  <div className="absolute inset-0 bg-gradient-to-t from-ink/90 via-ink/20 to-transparent" />

                  {/* Play Button Overlay */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/30 backdrop-blur-md text-ivory ring-1 ring-white/50 transition-all duration-300 group-hover:scale-110 group-hover:bg-gold group-hover:text-ink">
                      <Play className="h-5 w-5 fill-current ml-0.5" />
                    </div>
                  </div>

                  {/* Creator Details */}
                  <div className="absolute bottom-4 left-4 right-4 text-ivory">
                    <span className="text-[10px] font-medium tracking-wider text-gold block truncate">
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

      {/* 6. AMBASSADOR APPLICATION FORM */}
      <section id="apply-form" className="relative w-full bg-secondary/30 py-20 px-4 sm:px-6 md:px-8 lg:px-12 border-t border-stone/15">
        <div className="mx-auto max-w-2xl">
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center rounded-full bg-ink/5 p-3 text-gold mb-3">
              <HeartHandshake className="h-6 w-6" />
            </div>
            <h2 className="font-serif text-3xl sm:text-4xl font-normal uppercase tracking-wider text-ink mb-3">
              APPLY FOR AMBASSADOR ACCESS
            </h2>
            <p className="text-xs sm:text-sm text-stone leading-relaxed">
              Fill out your creator dossier below. Our PR Atelier team will review your channels and respond within 48 hours.
            </p>
          </div>

          {formSubmitted ? (
            <div className="rounded-3xl bg-white p-8 sm:p-12 ring-1 ring-gold/40 shadow-xl text-center">
              <div className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-gold/20 text-gold mb-4">
                <Check className="h-7 w-7" />
              </div>
              <h3 className="font-serif text-2xl font-semibold uppercase text-ink mb-2">
                Application Received
              </h3>
              <p className="text-xs sm:text-sm text-stone leading-relaxed max-w-md mx-auto mb-6">
                Thank you, {formData.name || "Creator"}. Your ambassador application dossier has been submitted to the LETTY PR Atelier. We will review your platforms and reach out via email shortly.
              </p>
              <div className="inline-flex items-center gap-2 rounded-full bg-secondary px-5 py-2 text-xs font-mono text-stone">
                Status: Under Review (Dossier #LTY-AMB-{Math.floor(1000 + Math.random() * 9000)})
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="rounded-3xl bg-white p-7 sm:p-10 shadow-lg ring-1 ring-black/5 space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-ink mb-1.5">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Elena Rostova"
                    className="w-full rounded-xl bg-ivory px-4 py-3 text-xs text-ink placeholder:text-stone/50 ring-1 ring-black/10 focus:outline-none focus:ring-2 focus:ring-gold"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-ink mb-1.5">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="elena@example.com"
                    className="w-full rounded-xl bg-ivory px-4 py-3 text-xs text-ink placeholder:text-stone/50 ring-1 ring-black/10 focus:outline-none focus:ring-2 focus:ring-gold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-ink mb-1.5">
                    Instagram Handle *
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-3 text-xs text-stone">@</span>
                    <input
                      type="text"
                      required
                      value={formData.instagram}
                      onChange={(e) => setFormData({ ...formData, instagram: e.target.value })}
                      placeholder="username"
                      className="w-full rounded-xl bg-ivory pl-8 pr-4 py-3 text-xs text-ink placeholder:text-stone/50 ring-1 ring-black/10 focus:outline-none focus:ring-2 focus:ring-gold"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-ink mb-1.5">
                    TikTok Handle (Optional)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-3 text-xs text-stone">@</span>
                    <input
                      type="text"
                      value={formData.tiktok}
                      onChange={(e) => setFormData({ ...formData, tiktok: e.target.value })}
                      placeholder="username"
                      className="w-full rounded-xl bg-ivory pl-8 pr-4 py-3 text-xs text-ink placeholder:text-stone/50 ring-1 ring-black/10 focus:outline-none focus:ring-2 focus:ring-gold"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-ink mb-1.5">
                    Primary Audience Size
                  </label>
                  <select
                    value={formData.followers}
                    onChange={(e) => setFormData({ ...formData, followers: e.target.value })}
                    className="w-full rounded-xl bg-ivory px-4 py-3 text-xs text-ink ring-1 ring-black/10 focus:outline-none focus:ring-2 focus:ring-gold"
                  >
                    <option value="1k-10k">1k – 10k (Emerging Creator)</option>
                    <option value="10k-50k">10k – 50k (Micro Influencer)</option>
                    <option value="50k-200k">50k – 200k (Mid-Tier Creator)</option>
                    <option value="200k+">200k+ (Macro Influencer)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-ink mb-1.5">
                    Portfolio / Media Kit URL
                  </label>
                  <input
                    type="url"
                    value={formData.portfolioUrl}
                    onChange={(e) => setFormData({ ...formData, portfolioUrl: e.target.value })}
                    placeholder="https://linktr.ee/yourname"
                    className="w-full rounded-xl bg-ivory px-4 py-3 text-xs text-ink placeholder:text-stone/50 ring-1 ring-black/10 focus:outline-none focus:ring-2 focus:ring-gold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-ink mb-1.5">
                  Why do you love LETTY Beauty? *
                </label>
                <textarea
                  rows={3}
                  required
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  placeholder="Tell us about your content style, favorite beauty ritual, and why you want to represent LETTY..."
                  className="w-full rounded-xl bg-ivory px-4 py-3 text-xs text-ink placeholder:text-stone/50 ring-1 ring-black/10 focus:outline-none focus:ring-2 focus:ring-gold resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full flex items-center justify-center gap-2 rounded-full bg-ink py-4 text-xs font-semibold uppercase tracking-luxe text-ivory shadow-lg transition-all duration-300 hover:bg-gold hover:text-ink cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <span>{submitting ? "Submitting Application..." : "Submit Ambassador Application"}</span>
                <Send className="h-3.5 w-3.5" />
              </button>
            </form>
          )}
        </div>
      </section>

      {/* 7. AMBASSADOR FAQS (Accordion) */}
      <section className="relative w-full py-20 px-4 sm:py-24 sm:px-6 md:px-8 lg:px-12">
        <div className="mx-auto max-w-3xl">
          <div className="text-center mb-12">
            <p className="text-xs font-semibold uppercase tracking-luxe text-gold mb-2">
              Program Details
            </p>
            <h2 className="font-serif text-2xl sm:text-3xl font-normal uppercase tracking-wider text-ink">
              AMBASSADOR FAQS
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
