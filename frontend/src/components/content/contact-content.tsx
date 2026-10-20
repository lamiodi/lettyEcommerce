"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowRight,
  Award,
  Check,
  Clock,
  Crown,
  Gift,
  HeartHandshake,
  Key,
  Mail,
  Phone,
  Share2,
  Sparkles,
  Truck,
} from "lucide-react";
import { toast } from "sonner";
import { LinedButton } from "@/components/shared/lined-button";
import { Reveal } from "@/components/shared/reveal";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { EASE_LUXURY, DURATION } from "@/lib/motion";

type ContactMode = "concierge" | "vip" | "ambassador";

export function ContactContent() {
  const searchParams = useSearchParams();
  const isVipParam = searchParams.get("vip") === "true";
  const isAmbassadorParam = searchParams.get("ambassador") === "true";

  const [mode, setMode] = useState<ContactMode>(() => {
    if (isVipParam) return "vip";
    if (isAmbassadorParam) return "ambassador";
    return "concierge";
  });

  // Common form state
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [orderId, setOrderId] = useState("");
  const [subject, setSubject] = useState("General Enquiry");
  const [message, setMessage] = useState("");
  const [submitted, setSubmitted] = useState(false);

  // VIP-specific state
  const [cityCountry, setCityCountry] = useState("");
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);

  // Ambassador-specific state
  const [socialHandle, setSocialHandle] = useState("");
  const [platform, setPlatform] = useState("Instagram");
  const [audienceSize, setAudienceSize] = useState("");
  const [portfolioLink, setPortfolioLink] = useState("");

  useEffect(() => {
    if (isVipParam) {
      setMode("vip");
      setSubject("VIP Club Membership Application");
    } else if (isAmbassadorParam) {
      setMode("ambassador");
      setSubject("Brand Ambassador & Creator Application");
    }
  }, [isVipParam, isAmbassadorParam]);

  const handleModeChange = (newMode: ContactMode) => {
    setMode(newMode);
    setSubmitted(false);
    if (newMode === "vip") {
      setSubject("VIP Club Membership Application");
    } else if (newMode === "ambassador") {
      setSubject("Brand Ambassador & Creator Application");
    } else {
      setSubject("General Enquiry");
    }
  };

  const toggleInterest = (interest: string) => {
    setSelectedInterests((prev) =>
      prev.includes(interest)
        ? prev.filter((i) => i !== interest)
        : [...prev, interest],
    );
  };

  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) {
      toast.error("Please fill in your name and email address.");
      return;
    }

    if (mode === "ambassador" && !socialHandle.trim()) {
      toast.error("Please share your primary social handle (@).");
      return;
    }
    if (mode === "concierge" && message.trim().length < 10) {
      toast.error("Please add at least 10 characters so our team can understand your enquiry.");
      document.getElementById("message")?.focus();
      return;
    }
    if (submitting) return;

    setSubmitting(true);

    const messageParts = [
      message.trim() ? message.trim() : `Inquiry submitted via LETTY ${mode.toUpperCase()} portal.`,
      phone ? `Phone: ${phone}` : null,
      orderId ? `Order Number: ${orderId}` : null,
      cityCountry ? `Location: ${cityCountry}` : null,
      selectedInterests.length > 0 ? `Areas of Interest: ${selectedInterests.join(", ")}` : null,
      socialHandle ? `Social Handle: ${socialHandle} (${platform})` : null,
      audienceSize ? `Audience Size: ${audienceSize}` : null,
      portfolioLink ? `Portfolio: ${portfolioLink}` : null,
    ].filter(Boolean);

    const fullMessage = messageParts.join("\n\n");

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          subject: subject || `${mode.toUpperCase()} Application`,
          message: fullMessage.length >= 10 ? fullMessage : `${fullMessage} (Confirmed submission)`,
          order_number: orderId.trim() || undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error || "Submission error");
      }

      setSubmitted(true);
      if (mode === "vip") {
        toast.success("VIP Sanctuary Application received by LETTY Concierge.");
      } else if (mode === "ambassador") {
        toast.success("Ambassador Portfolio received. Our creative team will review your application.");
      } else {
        toast.success("Message received. Our team will reply by email.");
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to send message. Please try again.";
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 md:px-8 md:py-20 space-y-16 lg:space-y-24">
      {/* Editorial Mode Segmented Navigation */}
      <div className="flex flex-col items-center gap-4 text-center">
        <p className="text-[11px] font-medium uppercase tracking-luxe text-gold">
          Concierge &amp; Community Portals
        </p>
        <div className="inline-flex max-w-full flex-wrap items-center justify-center gap-1.5 rounded-full bg-secondary/80 p-1.5 ring-1 ring-black/5 shadow-xs">
          <button
            type="button"
            onClick={() => handleModeChange("vip")}
            className={cn(
              "flex items-center gap-2 rounded-full px-5 py-2.5 text-xs font-semibold uppercase tracking-wider transition-all duration-300",
              mode === "vip"
                ? "bg-ink text-ivory shadow-md ring-1 ring-gold/40"
                : "text-stone hover:text-ink hover:bg-white/50",
            )}
          >
            <Crown className="h-3.5 w-3.5 text-gold" />
            <span>VIP Club (Inner Circle)</span>
          </button>

          <button
            type="button"
            onClick={() => handleModeChange("ambassador")}
            className={cn(
              "flex items-center gap-2 rounded-full px-5 py-2.5 text-xs font-semibold uppercase tracking-wider transition-all duration-300",
              mode === "ambassador"
                ? "bg-ink text-ivory shadow-md ring-1 ring-gold/40"
                : "text-stone hover:text-ink hover:bg-white/50",
            )}
          >
            <Sparkles className="h-3.5 w-3.5 text-gold" />
            <span>Creator Ambassador</span>
          </button>

          <button
            type="button"
            onClick={() => handleModeChange("concierge")}
            className={cn(
              "flex items-center gap-2 rounded-full px-5 py-2.5 text-xs font-semibold uppercase tracking-wider transition-all duration-300",
              mode === "concierge"
                ? "bg-ink text-ivory shadow-md ring-1 ring-gold/40"
                : "text-stone hover:text-ink hover:bg-white/50",
            )}
          >
            <Mail className="h-3.5 w-3.5" />
            <span>Client Care &amp; Concierge</span>
          </button>
        </div>
      </div>

      {/* Dynamic Main Viewport */}
      <AnimatePresence mode="wait">
        {mode === "vip" && (
          <motion.div
            key="vip-mode"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: DURATION.reveal, ease: EASE_LUXURY }}
            className="space-y-16"
          >
            {/* VIP Hero Section */}
            <div className="text-center max-w-3xl mx-auto space-y-4">
              <span className="inline-flex items-center gap-2 rounded-full bg-ink/5 px-4 py-1.5 text-[11px] font-medium uppercase tracking-luxe text-gold ring-1 ring-gold/30">
                <span className="h-1.5 w-1.5 rounded-full bg-gold animate-pulse" />
                The Inner Circle Sanctuary
              </span>
              <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-medium text-ink uppercase tracking-[0.14em]">
                LETTY VIP Sanctuary
              </h1>
              <span aria-hidden className="rule-gold mx-auto block h-px w-24 my-3" />
              <p className="text-stone text-sm sm:text-base leading-relaxed max-w-2xl mx-auto">
                Join the LETTY Inner Circle for product updates, member offers and news about our beauty range.
              </p>
            </div>

            {/* VIP Privileges Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
              <div className="bg-ivory/80 rounded-2xl p-6 sm:p-7 border border-line/80 shadow-xs hover:border-gold/40 transition-all space-y-3">
                <div className="h-10 w-10 rounded-full bg-gold/15 flex items-center justify-center text-gold">
                  <Key className="h-5 w-5" />
                </div>
                <h3 className="font-serif text-lg font-medium text-ink">
                  New Product Updates
                </h3>
                <p className="text-xs sm:text-sm text-stone leading-relaxed">
                  Hear about new LETTY launches and preorder announcements. Availability and dispatch details are shown on each product page.
                </p>
              </div>

              <div className="bg-ivory/80 rounded-2xl p-6 sm:p-7 border border-line/80 shadow-xs hover:border-gold/40 transition-all space-y-3">
                <div className="h-10 w-10 rounded-full bg-gold/15 flex items-center justify-center text-gold">
                  <Gift className="h-5 w-5" />
                </div>
                <h3 className="font-serif text-lg font-medium text-ink">
                  Member Offers
                </h3>
                <p className="text-xs sm:text-sm text-stone leading-relaxed">
                  Discover member offers when available. Each promotion includes its own eligibility, availability and redemption details.
                </p>
              </div>

              <div className="bg-ivory/80 rounded-2xl p-6 sm:p-7 border border-line/80 shadow-xs hover:border-gold/40 transition-all space-y-3">
                <div className="h-10 w-10 rounded-full bg-gold/15 flex items-center justify-center text-gold">
                  <Sparkles className="h-5 w-5" />
                </div>
                <h3 className="font-serif text-lg font-medium text-ink">
                  Stay in the Loop
                </h3>
                <p className="text-xs sm:text-sm text-stone leading-relaxed">
                  Receive updates about LETTY beauty, shade options and selected promotions.
                </p>
              </div>

              <div className="bg-ivory/80 rounded-2xl p-6 sm:p-7 border border-line/80 shadow-xs hover:border-gold/40 transition-all space-y-3">
                <div className="h-10 w-10 rounded-full bg-gold/15 flex items-center justify-center text-gold">
                  <HeartHandshake className="h-5 w-5" />
                </div>
                <h3 className="font-serif text-lg font-medium text-ink">
                  Product Support
                </h3>
                <p className="text-xs sm:text-sm text-stone leading-relaxed">
                  Contact our team for help with product details, shade options and your order.
                </p>
              </div>

              <div className="bg-ivory/80 rounded-2xl p-6 sm:p-7 border border-line/80 shadow-xs hover:border-gold/40 transition-all space-y-3">
                <div className="h-10 w-10 rounded-full bg-gold/15 flex items-center justify-center text-gold">
                  <Truck className="h-5 w-5" />
                </div>
                <h3 className="font-serif text-lg font-medium text-ink">
                  Delivery Information
                </h3>
                <p className="text-xs sm:text-sm text-stone leading-relaxed">
                  Check delivery options and costs at checkout. Preorder products have a separate estimated dispatch window.
                </p>
              </div>

              <div className="bg-ivory/80 rounded-2xl p-6 sm:p-7 border border-line/80 shadow-xs hover:border-gold/40 transition-all space-y-3">
                <div className="h-10 w-10 rounded-full bg-gold/15 flex items-center justify-center text-gold">
                  <Crown className="h-5 w-5" />
                </div>
                <h3 className="font-serif text-lg font-medium text-ink">
                  Your LETTY Account
                </h3>
                <p className="text-xs sm:text-sm text-stone leading-relaxed">
                  Sign in to view your orders and manage your LETTY account.
                </p>
              </div>
            </div>

            {/* VIP Application Form */}
            <div id="vip-form" className="max-w-2xl mx-auto bg-ivory p-6 sm:p-10 rounded-3xl border border-line shadow-md">
              <div className="text-center mb-8">
                <p className="text-xs uppercase tracking-luxe text-gold font-medium">Application Portal</p>
                <h2 className="font-serif text-2xl sm:text-3xl text-ink font-medium mt-1">
                  Request VIP Membership
                </h2>
                <p className="text-xs sm:text-sm text-stone mt-2">
                  Membership is curated. Complete the brief form below and an advisor will confirm your status.
                </p>
              </div>

              {submitted ? (
                <div className="py-12 text-center space-y-4">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-gold/20 text-gold">
                    <Check className="h-7 w-7" />
                  </div>
                  <h3 className="font-serif text-2xl text-ink font-medium">Application Received</h3>
                  <p className="text-stone text-sm max-w-md mx-auto">
                    Thank you, <span className="font-medium text-ink">{name}</span>. Your Inner Circle request has been received. Our team will reply to <span className="font-medium text-ink">{email}</span> after reviewing it.
                  </p>
                  <div className="pt-4 flex justify-center">
                    <LinedButton href="/shop">Explore Boutique</LinedButton>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="vip-name" className="text-[11px] uppercase tracking-luxe text-stone">
                        Full Name *
                      </Label>
                      <Input
                        id="vip-name"
                        required
                        placeholder="Your full name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="h-11 rounded-none border-0 border-b border-line bg-transparent px-0 text-sm focus-visible:ring-0 focus-visible:border-ink"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="vip-email" className="text-[11px] uppercase tracking-luxe text-stone">
                        Email Address *
                      </Label>
                      <Input
                        id="vip-email"
                        type="email"
                        required
                        placeholder="vivienne@domain.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="h-11 rounded-none border-0 border-b border-line bg-transparent px-0 text-sm focus-visible:ring-0 focus-visible:border-ink"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="vip-phone" className="text-[11px] uppercase tracking-luxe text-stone">
                        Telephone / WhatsApp
                      </Label>
                      <Input
                        id="vip-phone"
                        type="tel"
                        placeholder="+44 20 7946 0991"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="h-11 rounded-none border-0 border-b border-line bg-transparent px-0 text-sm focus-visible:ring-0 focus-visible:border-ink"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="vip-city" className="text-[11px] uppercase tracking-luxe text-stone">
                        City &amp; Country
                      </Label>
                      <Input
                        id="vip-city"
                        placeholder="London, United Kingdom"
                        value={cityCountry}
                        onChange={(e) => setCityCountry(e.target.value)}
                        className="h-11 rounded-none border-0 border-b border-line bg-transparent px-0 text-sm focus-visible:ring-0 focus-visible:border-ink"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-[11px] uppercase tracking-luxe text-stone">
                      Primary Beauty Categories of Interest
                    </Label>
                    <div className="flex flex-wrap gap-2 pt-1">
                      {["Lip Sculpt & Contour", "Glass Shine Glosses", "Haute Fragrances", "Atelier Eyewear", "Body Care Rituals"].map(
                        (cat) => {
                          const active = selectedInterests.includes(cat);
                          return (
                            <button
                              key={cat}
                              type="button"
                              onClick={() => toggleInterest(cat)}
                              className={cn(
                                "rounded-full px-3.5 py-1.5 text-xs font-medium uppercase tracking-wider transition-all",
                                active
                                  ? "bg-gold text-ink ring-1 ring-gold shadow-2xs font-semibold"
                                  : "bg-secondary/70 text-stone hover:text-ink ring-1 ring-black/5",
                              )}
                            >
                              {cat}
                            </button>
                          );
                        },
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="vip-notes" className="text-[11px] uppercase tracking-luxe text-stone">
                      Personal Beauty Notes or Specific Privileges Desired
                    </Label>
                    <textarea
                      id="vip-notes"
                      rows={4}
                      placeholder="Share any preferred shades, skin undertones, or private services you would like our concierge to prepare..."
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      className="w-full rounded-none border-0 border-b border-line bg-transparent p-2 text-sm text-ink focus:outline-none focus:border-ink resize-y"
                    />
                  </div>

                  <div className="pt-4 flex justify-center">
                    <LinedButton type="submit" width="w-full max-w-[280px]">
                      Request VIP Membership
                    </LinedButton>
                  </div>
                </form>
              )}
            </div>
          </motion.div>
        )}

        {mode === "ambassador" && (
          <motion.div
            key="ambassador-mode"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: DURATION.reveal, ease: EASE_LUXURY }}
            className="space-y-16"
          >
            {/* Ambassador Hero Section */}
            <div className="text-center max-w-3xl mx-auto space-y-4">
              <span className="inline-flex items-center gap-2 rounded-full bg-ink/5 px-4 py-1.5 text-[11px] font-medium uppercase tracking-luxe text-gold ring-1 ring-gold/30">
                <Sparkles className="h-3.5 w-3.5 text-gold" />
                Global Beauty Ambassadors &amp; Creators
              </span>
              <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-medium text-ink uppercase tracking-[0.14em]">
                Join the Ambassador Edit
              </h1>
              <span aria-hidden className="rule-gold mx-auto block h-px w-24 my-3" />
              <p className="text-stone text-sm sm:text-base leading-relaxed max-w-2xl mx-auto">
                Create beauty content with LETTY. Apply to share our lip and lash products with your community, with partnership details confirmed if your application is accepted.
              </p>
            </div>

            {/* Ambassador Benefits Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
              <div className="bg-ivory/80 rounded-2xl p-6 sm:p-7 border border-line/80 shadow-xs hover:border-gold/40 transition-all space-y-3">
                <div className="h-10 w-10 rounded-full bg-gold/15 flex items-center justify-center text-gold">
                  <Gift className="h-5 w-5" />
                </div>
                <h3 className="font-serif text-lg font-medium text-ink">
                  Seasonal PR Gifting Suites
                </h3>
                <p className="text-xs sm:text-sm text-stone leading-relaxed">
                  Selected creators may receive LETTY products for content creation. Product availability and gifting terms are agreed for each collaboration.
                </p>
              </div>

              <div className="bg-ivory/80 rounded-2xl p-6 sm:p-7 border border-line/80 shadow-xs hover:border-gold/40 transition-all space-y-3">
                <div className="h-10 w-10 rounded-full bg-gold/15 flex items-center justify-center text-gold">
                  <Award className="h-5 w-5" />
                </div>
                <h3 className="font-serif text-lg font-medium text-ink">
                  Tiered 10%–15% Commission
                </h3>
                <p className="text-xs sm:text-sm text-stone leading-relaxed">
                  Any commission, referral links and campaign terms are agreed in writing for each collaboration.
                </p>
              </div>

              <div className="bg-ivory/80 rounded-2xl p-6 sm:p-7 border border-line/80 shadow-xs hover:border-gold/40 transition-all space-y-3">
                <div className="h-10 w-10 rounded-full bg-gold/15 flex items-center justify-center text-gold">
                  <svg className="h-5 w-5 fill-current" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                  </svg>
                </div>
                <h3 className="font-serif text-lg font-medium text-ink">
                  Spotlight on @lettybeautyofficial
                </h3>
                <p className="text-xs sm:text-sm text-stone leading-relaxed">
                  Share your LETTY looks on Instagram and TikTok for a chance to be featured on our channels, with your permission.
                </p>
              </div>

              <div className="bg-ivory/80 rounded-2xl p-6 sm:p-7 border border-line/80 shadow-xs hover:border-gold/40 transition-all space-y-3">
                <div className="h-10 w-10 rounded-full bg-gold/15 flex items-center justify-center text-gold">
                  <Sparkles className="h-5 w-5" />
                </div>
                <h3 className="font-serif text-lg font-medium text-ink">
                  Share Your Feedback
                </h3>
                <p className="text-xs sm:text-sm text-stone leading-relaxed">
                  Tell us what you think of our products and which shades or beauty essentials you would like to see next.
                </p>
              </div>

              <div className="bg-ivory/80 rounded-2xl p-6 sm:p-7 border border-line/80 shadow-xs hover:border-gold/40 transition-all space-y-3">
                <div className="h-10 w-10 rounded-full bg-gold/15 flex items-center justify-center text-gold">
                  <Share2 className="h-5 w-5" />
                </div>
                <h3 className="font-serif text-lg font-medium text-ink">
                  Exclusive Creator Media Kit
                </h3>
                <p className="text-xs sm:text-sm text-stone leading-relaxed">
                  Full access to high-resolution campaign assets, soundscapes, editorial guides, and early embargo briefings for seamless content production.
                </p>
              </div>

              <div className="bg-ivory/80 rounded-2xl p-6 sm:p-7 border border-line/80 shadow-xs hover:border-gold/40 transition-all space-y-3">
                <div className="h-10 w-10 rounded-full bg-gold/15 flex items-center justify-center text-gold">
                  <Crown className="h-5 w-5" />
                </div>
                <h3 className="font-serif text-lg font-medium text-ink">
                  Stay Connected
                </h3>
                <p className="text-xs sm:text-sm text-stone leading-relaxed">
                  Selected ambassadors receive campaign information and collaboration details. Any gifting or commission is confirmed in the agreed campaign terms.
                </p>
              </div>
            </div>

            {/* Ambassador Application Form */}
            <div id="ambassador-form" className="max-w-2xl mx-auto bg-ivory p-6 sm:p-10 rounded-3xl border border-line shadow-md">
              <div className="text-center mb-8">
                <p className="text-xs uppercase tracking-luxe text-gold font-medium">Creator Application</p>
                <h2 className="font-serif text-2xl sm:text-3xl text-ink font-medium mt-1">
                  Apply for Ambassador Roster
                </h2>
                <p className="text-xs sm:text-sm text-stone mt-2">
                  We welcome creators of all community sizes who share our passion for effortless beauty and quiet luxury.
                </p>
              </div>

              {submitted ? (
                <div className="py-12 text-center space-y-4">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-gold/20 text-gold">
                    <Check className="h-7 w-7" />
                  </div>
                  <h3 className="font-serif text-2xl text-ink font-medium">Application Received</h3>
                  <p className="text-stone text-sm max-w-md mx-auto">
                    Thank you, <span className="font-medium text-ink">{name}</span>. Our team has received your profile (<span className="font-medium text-ink">{socialHandle}</span>) and will connect via <span className="font-medium text-ink">{email}</span> after reviewing your application.
                  </p>
                  <div className="pt-4 flex justify-center">
                    <LinedButton href="/shop">Explore Collections</LinedButton>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="amb-name" className="text-[11px] uppercase tracking-luxe text-stone">
                        Creator / Full Name *
                      </Label>
                      <Input
                        id="amb-name"
                        required
                        placeholder="e.g. Elena Moreau"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="h-11 rounded-none border-0 border-b border-line bg-transparent px-0 text-sm focus-visible:ring-0 focus-visible:border-ink"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="amb-email" className="text-[11px] uppercase tracking-luxe text-stone">
                        Business Email Address *
                      </Label>
                      <Input
                        id="amb-email"
                        type="email"
                        required
                        placeholder="elena@agency.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="h-11 rounded-none border-0 border-b border-line bg-transparent px-0 text-sm focus-visible:ring-0 focus-visible:border-ink"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="amb-platform" className="text-[11px] uppercase tracking-luxe text-stone">
                        Primary Platform
                      </Label>
                      <select
                        id="amb-platform"
                        value={platform}
                        onChange={(e) => setPlatform(e.target.value)}
                        className="w-full h-11 rounded-none border-0 border-b border-line bg-transparent px-0 text-sm text-ink focus:outline-none focus:border-ink"
                      >
                        <option value="Instagram">Instagram</option>
                        <option value="TikTok">TikTok</option>
                        <option value="YouTube">YouTube</option>
                        <option value="Editorial Blog / Substack">Editorial Blog / Substack</option>
                      </select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="amb-handle" className="text-[11px] uppercase tracking-luxe text-stone">
                        Handle (@) *
                      </Label>
                      <Input
                        id="amb-handle"
                        required
                        placeholder="@yourhandle"
                        value={socialHandle}
                        onChange={(e) => setSocialHandle(e.target.value)}
                        className="h-11 rounded-none border-0 border-b border-line bg-transparent px-0 text-sm focus-visible:ring-0 focus-visible:border-ink"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="amb-reach" className="text-[11px] uppercase tracking-luxe text-stone">
                        Audience Size
                      </Label>
                      <select
                        id="amb-reach"
                        value={audienceSize}
                        onChange={(e) => setAudienceSize(e.target.value)}
                        className="w-full h-11 rounded-none border-0 border-b border-line bg-transparent px-0 text-sm text-ink focus:outline-none focus:border-ink"
                      >
                        <option value="">Select range...</option>
                        <option value="Under 10k">Under 10K (Micro-Creator)</option>
                        <option value="10k - 50k">10K – 50K</option>
                        <option value="50k - 200k">50K – 200K</option>
                        <option value="200k+">200K+ (Macro-Creator)</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="amb-link" className="text-[11px] uppercase tracking-luxe text-stone">
                      Portfolio / Media Kit / Linktree (Optional)
                    </Label>
                    <Input
                      id="amb-link"
                      type="url"
                      placeholder="https://instagram.com/yourhandle or media kit link"
                      value={portfolioLink}
                      onChange={(e) => setPortfolioLink(e.target.value)}
                      className="h-11 rounded-none border-0 border-b border-line bg-transparent px-0 text-sm focus-visible:ring-0 focus-visible:border-ink"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="amb-message" className="text-[11px] uppercase tracking-luxe text-stone">
                      Tell us about your aesthetic &amp; why you love LETTY *
                    </Label>
                    <textarea
                      id="amb-message"
                      required
                      rows={4}
                      placeholder="Describe your beauty style, your content philosophy, and how you envision sharing LETTY rituals with your audience..."
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      className="w-full rounded-none border-0 border-b border-line bg-transparent p-2 text-sm text-ink focus:outline-none focus:border-ink resize-y"
                    />
                  </div>

                  <div className="pt-4 flex justify-center">
                    <LinedButton type="submit" width="w-full max-w-[280px]">
                      Submit Ambassador Application
                    </LinedButton>
                  </div>
                </form>
              )}
            </div>
          </motion.div>
        )}

        {mode === "concierge" && (
          <motion.div
            key="concierge-mode"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: DURATION.reveal, ease: EASE_LUXURY }}
            className="space-y-16"
          >
            <div className="text-center max-w-3xl mx-auto space-y-3">
              <p className="text-xs font-medium uppercase tracking-luxe text-stone">Customer Care &amp; Concierge</p>
              <h1 className="font-serif text-4xl font-medium text-ink md:text-5xl">
                At Your Service
              </h1>
              <p className="text-stone text-sm md:text-base">
                We’re here to assist with orders, product enquiries, recommendations and anything else you may need.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
              {/* Contact Form */}
              <div id="contact-form" className="lg:col-span-7">
                <div className="bg-ivory p-6 md:p-10 rounded-2xl border border-line">
                  <h2 className="font-serif text-2xl font-medium text-ink mb-6">Send a Message</h2>

                  {submitted ? (
                    <div className="py-12 text-center space-y-4">
                      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-secondary text-ink">
                        <Mail className="h-7 w-7" />
                      </div>
                      <h3 className="font-serif text-2xl text-ink font-medium">Message Received</h3>
                      <p className="text-stone text-sm max-w-sm mx-auto">
                        Thank you, <span className="font-medium text-ink">{name}</span>. Our team will reply to <span className="font-medium text-ink">{email}</span> after reviewing your message.
                      </p>
                      <div className="mt-4 flex justify-center gap-4">
                        <LinedButton href="/shop">Return to Boutique</LinedButton>
                        <button
                          type="button"
                          onClick={() => setSubmitted(false)}
                          className="text-xs uppercase tracking-luxe text-stone hover:text-ink transition-colors cursor-pointer"
                        >
                          Send Another Inquiry
                        </button>
                      </div>
                    </div>
                  ) : (
                    <form onSubmit={handleSubmit} className="space-y-6">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="name" className="text-[11px] uppercase tracking-luxe text-stone">
                            Full Name *
                          </Label>
                          <Input
                            id="name"
                            required
                            placeholder="Your full name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="h-11 rounded-none border-0 border-b border-line bg-transparent px-0 text-sm focus-visible:ring-0 focus-visible:border-ink"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="email" className="text-[11px] uppercase tracking-luxe text-stone">
                            Email Address *
                          </Label>
                          <Input
                            id="email"
                            type="email"
                            required
                            placeholder="name@domain.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="h-11 rounded-none border-0 border-b border-line bg-transparent px-0 text-sm focus-visible:ring-0 focus-visible:border-ink"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="phone" className="text-[11px] uppercase tracking-luxe text-stone">
                            Phone Number (Optional)
                          </Label>
                          <Input
                            id="phone"
                            type="tel"
                            placeholder="+1 (555) 000-0000"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            className="h-11 rounded-none border-0 border-b border-line bg-transparent px-0 text-sm focus-visible:ring-0 focus-visible:border-ink"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="orderId" className="text-[11px] uppercase tracking-luxe text-stone">
                            Order # (Optional)
                          </Label>
                          <Input
                            id="orderId"
                            placeholder="e.g. L0328159"
                            value={orderId}
                            onChange={(e) => setOrderId(e.target.value)}
                            className="h-11 rounded-none border-0 border-b border-line bg-transparent px-0 text-sm focus-visible:ring-0 focus-visible:border-ink"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="subject" className="text-[11px] uppercase tracking-luxe text-stone">
                          Inquiry Topic
                        </Label>
                        <select
                          id="subject"
                          required
                          value={subject}
                          onChange={(e) => setSubject(e.target.value)}
                          className="w-full h-11 rounded-none border-0 border-b border-line bg-transparent px-0 text-sm text-ink focus:outline-none focus:border-ink"
                        >
                          <option value="General Enquiry">General Enquiry</option>
                          <option value="Order Enquiry & Delivery">Order Enquiry & Delivery</option>
                          <option value="Returns & Exchanges">Returns & Exchanges</option>
                          <option value="Product Advice">Product Advice</option>
                          <option value="Press & Media">Press & Media</option>
                        </select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="message" className="text-[11px] uppercase tracking-luxe text-stone">
                          Your Message *
                        </Label>
                        <textarea
                          id="message"
                          required
                          minLength={10}
                          rows={5}
                          placeholder="How may our concierge assist you?"
                          value={message}
                          onChange={(e) => setMessage(e.target.value)}
                          className="w-full min-h-[120px] rounded-none border-0 border-b border-line bg-transparent p-2 text-sm text-ink focus:outline-none focus:border-ink resize-y"
                        />
                      </div>

                      <div className="pt-2 flex justify-center">
                        <LinedButton type="submit" disabled={submitting}>{submitting ? "Sending..." : "Send Message"}</LinedButton>
                      </div>
                    </form>
                  )}
                </div>
              </div>

              {/* Right Info Sidebar */}
              <div className="lg:col-span-5 space-y-8">
                <div className="bg-ivory p-6 md:p-8 space-y-6 rounded-2xl border border-line">
                  <h2 className="font-serif text-xl font-medium text-ink border-b border-line pb-3">
                    Direct Concierge Lines
                  </h2>

                  <div className="space-y-5 text-sm">
                    <div className="flex items-start gap-3">
                      <Mail className="h-4 w-4 text-stone mt-0.5" />
                      <div>
                        <p className="text-[11px] uppercase tracking-luxe text-stone">Concierge Email</p>
                        <a
                          href="mailto:hello@houseofletty.com"
                          className="font-medium text-ink underline-offset-4 hover:underline"
                        >
                          hello@houseofletty.com
                        </a>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <Phone className="h-4 w-4 text-stone mt-0.5" />
                      <div>
                        <p className="text-[11px] uppercase tracking-luxe text-stone">Telephone &amp; WhatsApp Concierge</p>
                        <a
                          href="https://wa.me/447311564331"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-medium text-ink underline-offset-4 hover:underline"
                        >
                          +44 7311 564331
                        </a>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <Clock className="h-4 w-4 text-stone mt-0.5" />
                      <div>
                        <p className="text-[11px] uppercase tracking-luxe text-stone">Customer Care Hours</p>
                        <p className="font-medium text-ink">Monday to Saturday: 9:00 to 19:00 (UK local time)</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* The LETTY Experience & Customer Care Section */}
      <section className="pt-12 border-t border-line">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <Reveal className="bg-ivory p-8 md:p-12 flex flex-col justify-between space-y-6 rounded-2xl border border-line">
            <div className="space-y-4">
              <p className="text-xs uppercase tracking-luxe text-stone font-medium">The LETTY Experience</p>
              <h2 className="font-serif text-2xl md:text-3xl font-medium text-ink">
                Beauty, Wherever You Are
              </h2>
              <p className="text-stone text-sm md:text-base leading-relaxed">
                Discover the world of LETTY from wherever you are. Explore our beauty collection, thoughtfully curated for your everyday rituals.
              </p>
            </div>
            <div className="pt-2">
              <LinedButton href="/shop">Explore Collection</LinedButton>
            </div>
          </Reveal>

          <Reveal delay={0.1} className="bg-ivory p-8 md:p-12 flex flex-col justify-between space-y-6 rounded-2xl border border-line">
            <div className="space-y-4">
              <p className="text-xs uppercase tracking-luxe text-stone font-medium">Customer Care</p>
              <h2 className="font-serif text-2xl md:text-3xl font-medium text-ink">
                Dedicated Advisory
              </h2>
              <p className="text-stone text-sm md:text-base leading-relaxed">
                For product guidance, order assistance and general enquiries, our team is here to assist.
              </p>
            </div>
            <div className="pt-2">
              <button
                type="button"
                onClick={() => {
                  handleModeChange("concierge");
                  const el = document.getElementById("contact-form");
                  if (el) {
                    el.scrollIntoView({ behavior: "smooth" });
                    const input = el.querySelector("input");
                    input?.focus();
                  }
                }}
                className="inline-flex items-center gap-2 text-xs uppercase tracking-luxe font-medium text-ink hover:text-stone transition-colors group cursor-pointer"
              >
                <span>Contact Customer Care</span>
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </button>
            </div>
          </Reveal>
        </div>
      </section>
    </div>
  );
}
