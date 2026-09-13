"use client";

import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  ArrowLeft,
  Check,
  ChevronDown,
  Send,
  HeartHandshake,
  HelpCircle,
  Mail,
  ShieldCheck,
} from "lucide-react";
import { EASE_LUXURY } from "@/lib/motion";
import { AMBASSADOR_FAQS } from "@/lib/data/ambassadors";

export function AmbassadorApplyContent() {
  const [openFaq, setOpenFaq] = useState<number | null>(0);

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
  const [dossierId, setDossierId] = useState<string>("");

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
    const generatedDossier = `LTY-AMB-${Math.floor(1000 + Math.random() * 9000)}`;

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name.trim(),
          email: formData.email.trim(),
          subject: `Brand Ambassador Application: ${formData.name.trim()} (@${formData.instagram || formData.tiktok || "creator"})`,
          message: fullMessage.length >= 10 ? fullMessage : `${fullMessage} (Ambassador application confirmed - ${generatedDossier})`,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error || "Submission failed");
      }

      setDossierId(generatedDossier);
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
    <div className="w-full bg-ivory text-ink selection:bg-gold/20 selection:text-ink min-h-screen">
      {/* 1. TOP NAVIGATION / BREADCRUMB STRIP */}
      <div className="border-b border-stone/15 bg-white/60 backdrop-blur-md sticky top-0 z-20">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between">
          <Link
            href="/ambassadors"
            className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-luxe text-stone hover:text-ink transition-colors duration-200"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Return to Ambassador Atelier</span>
          </Link>

          <a
            href="#faqs-section"
            className="inline-flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wider text-gold hover:text-ink transition-colors duration-200"
          >
            <HelpCircle className="h-3.5 w-3.5" />
            <span>View Program FAQs</span>
          </a>
        </div>
      </div>

      {/* 2. HEADER HERO */}
      <section className="relative overflow-hidden bg-ink py-10 px-4 sm:py-20 sm:px-6 lg:px-8 text-center text-ivory">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(169,138,95,0.2)_0%,transparent_70%)] pointer-events-none" />
        
        <div className="relative z-10 mx-auto max-w-3xl">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: EASE_LUXURY }}
          >
            <div className="inline-flex items-center gap-2 rounded-full bg-ivory/10 backdrop-blur-md px-3.5 py-1 sm:px-4 sm:py-1.5 text-[11px] sm:text-xs font-medium uppercase tracking-luxe text-gold ring-1 ring-gold/30 mb-4 sm:mb-5">
              <Sparkles className="h-3.5 w-3.5 text-gold" />
              <span>Official Creator Dossier</span>
            </div>

            <h1 className="font-serif text-2xl sm:text-4xl md:text-5xl font-normal uppercase tracking-[0.14em] text-ivory mb-3 sm:mb-4 leading-tight">
              AMBASSADOR APPLICATION <br />
              <span className="text-gold italic font-light">&amp; FREQUENTLY ASKED QUESTIONS</span>
            </h1>

            <p className="mx-auto max-w-xl text-xs sm:text-sm text-ivory/80 font-light leading-relaxed">
              Complete your creator profile below to be considered for the LETTY Global Ambassador Atelier. Review key questions regarding commissions, gifting suites, and partnerships.
            </p>
          </motion.div>
        </div>
      </section>

      {/* 3. APPLICATION FORM SECTION */}
      <section id="application-form" className="relative py-8 px-4 sm:py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl">
          <div className="text-center mb-10">
            <div className="inline-flex items-center justify-center rounded-full bg-ink/5 p-3 text-gold mb-3">
              <HeartHandshake className="h-6 w-6" />
            </div>
            <h2 className="font-serif text-2xl sm:text-3xl font-normal uppercase tracking-wider text-ink mb-2">
              CREATOR APPLICATION DOSSIER
            </h2>
            <p className="text-xs sm:text-sm text-stone leading-relaxed">
              Please share accurate details and links to your active social channels. Our Creator Relations Atelier reviews submissions weekly.
            </p>
          </div>

          {formSubmitted ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, ease: EASE_LUXURY }}
              className="rounded-3xl bg-white p-8 sm:p-12 ring-1 ring-gold/40 shadow-xl text-center"
            >
              <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-gold/20 text-gold mb-5">
                <Check className="h-8 w-8" />
              </div>
              <h3 className="font-serif text-2xl font-semibold uppercase text-ink mb-2">
                Application Successfully Submitted
              </h3>
              <p className="text-xs sm:text-sm text-stone leading-relaxed max-w-md mx-auto mb-6">
                Thank you, {formData.name || "Creator"}. Your ambassador application dossier has been received by the LETTY PR Atelier. We will review your platforms and reach out via email within 48 to 72 business hours.
              </p>
              
              <div className="inline-flex items-center gap-2 rounded-full bg-secondary px-5 py-2.5 text-xs font-mono text-ink mb-8 ring-1 ring-stone/15">
                <ShieldCheck className="h-4 w-4 text-gold" />
                <span>Status: Under Review (Dossier #{dossierId || "LTY-AMB-8832"})</span>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-4">
                <Link
                  href="/ambassadors"
                  className="rounded-full bg-ink px-6 py-3 text-xs font-semibold uppercase tracking-luxe text-ivory transition-all hover:bg-gold hover:text-ink"
                >
                  Return to Ambassador Program
                </Link>
                <Link
                  href="/shop"
                  className="rounded-full bg-ivory px-6 py-3 text-xs font-semibold uppercase tracking-luxe text-ink ring-1 ring-stone/20 transition-all hover:bg-white"
                >
                  Explore Collection
                </Link>
              </div>
            </motion.div>
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
                  rows={4}
                  required
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  placeholder="Tell us about your content style, favorite beauty rituals, and why you want to represent LETTY..."
                  className="w-full rounded-xl bg-ivory px-4 py-3 text-xs text-ink placeholder:text-stone/50 ring-1 ring-black/10 focus:outline-none focus:ring-2 focus:ring-gold resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full flex items-center justify-center gap-2 rounded-full bg-ink py-4 text-xs font-semibold uppercase tracking-luxe text-ivory shadow-lg transition-all duration-300 hover:bg-gold hover:text-ink cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <span>{submitting ? "Submitting Application Dossier..." : "Submit Ambassador Application"}</span>
                <Send className="h-3.5 w-3.5" />
              </button>
            </form>
          )}
        </div>
      </section>

      {/* 4. FAQS SECTION */}
      <section id="faqs-section" className="relative w-full bg-secondary/30 py-20 px-4 sm:py-24 sm:px-6 lg:px-8 border-t border-stone/15">
        <div className="mx-auto max-w-3xl">
          <div className="text-center mb-12">
            <p className="text-xs font-semibold uppercase tracking-luxe text-gold mb-2">
              Everything You Need to Know
            </p>
            <h2 className="font-serif text-2xl sm:text-3xl md:text-4xl font-normal uppercase tracking-wider text-ink">
              AMBASSADOR FAQS
            </h2>
            <p className="text-xs sm:text-sm text-stone mt-2">
              Clear answers regarding commissions, PR gifting, exclusivity, and eligibility.
            </p>
          </div>

          <div className="space-y-4">
            {AMBASSADOR_FAQS.map((faq, idx) => {
              const isOpen = openFaq === idx;
              return (
                <div
                  key={idx}
                  className="rounded-2xl bg-white ring-1 ring-black/5 overflow-hidden transition-all duration-300 shadow-xs"
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

          {/* Concierge Help Banner */}
          <div className="mt-12 rounded-2xl bg-white p-6 sm:p-8 text-center ring-1 ring-stone/15 shadow-xs">
            <Mail className="h-6 w-6 text-gold mx-auto mb-2" />
            <h3 className="font-serif text-base font-semibold uppercase text-ink mb-1">
              Have a bespoke inquiry or press question?
            </h3>
            <p className="text-xs text-stone max-w-md mx-auto mb-4">
              Our Creator Relations team is available for brand agencies, talent managers, and independent creators.
            </p>
            <a
              href="mailto:contact@lettybeauty.com?subject=Creator%20Inquiry"
              className="inline-flex items-center justify-center rounded-full bg-ink px-6 py-2.5 text-xs font-semibold uppercase tracking-luxe text-ivory hover:bg-gold hover:text-ink transition-colors"
            >
              Contact Creator Relations
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
