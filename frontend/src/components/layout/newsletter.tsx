"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { LettyImage } from "@/components/shared/letty-image";
import { LinedButton } from "@/components/shared/lined-button";
import { Reveal } from "@/components/shared/reveal";
import { EASE_LUXURY, DURATION } from "@/lib/motion";

/** Newsletter signup — frontend only, wires to Resend later. */
export function Newsletter() {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.includes("@")) {
      toast.error("Please enter a valid email address.");
      return;
    }
    setSubmitting(true);
    setTimeout(() => {
      setSubmitting(false);
      setSuccess(true);
      setEmail("");
      toast.success("Welcome to the maison. Your first letter is on its way.");
    }, 600);
  };

  return (
    <section
      aria-labelledby="newsletter-heading"
      className="relative border-y border-line bg-ivory"
    >
      <div className="grid grid-cols-1 lg:grid-cols-2">
        {/* Editorial portrait side */}
        <div className="relative aspect-[4/5] overflow-hidden bg-secondary lg:aspect-auto lg:min-h-[560px]">
          <LettyImage
            imageKey="newsletterBackground"
            alt="The Maison — Beauty, ritual & the art of everyday luxury"
            sizes="(max-width: 1024px) 100vw, 50vw"
            className="object-cover"
          />
          <div
            aria-hidden
            className="absolute inset-0 bg-gradient-to-t from-ink/75 via-ink/20 to-transparent lg:bg-gradient-to-r lg:from-transparent lg:via-transparent lg:to-ivory/20"
          />
          <div className="absolute left-6 top-6 lg:left-10 lg:top-10">
            <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-ivory">
              THE MAISON
            </p>
            <hr className="mt-3 w-12 border-ivory/60" />
          </div>
          <div className="absolute bottom-6 left-6 right-6 lg:bottom-12 lg:left-10 lg:right-10">
            <p className="font-serif text-2xl font-light uppercase tracking-[0.16em] leading-snug text-ivory md:text-3xl lg:text-4xl">
              BEAUTY, RITUAL & THE ART<br />OF EVERYDAY LUXURY.
            </p>
          </div>
        </div>

        {/* Signup side */}
        <div className="flex items-center bg-ivory px-6 py-16 sm:px-10 md:py-20 lg:px-16 lg:py-24">
          <Reveal className="w-full">
            <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-gold">
              THE LETTY LETTER
            </p>
            <h2
              id="newsletter-heading"
              className="mt-3 font-serif text-3xl font-medium uppercase tracking-[0.14em] text-ink sm:text-4xl md:text-5xl leading-tight"
            >
              NOTES FROM THE<br />MAISON
            </h2>
            <p className="mt-5 max-w-md text-sm leading-relaxed text-ink md:text-base font-medium">
              Join thousands of beauty enthusiasts discovering new rituals every week.
            </p>
            <p className="mt-2 max-w-md text-sm leading-relaxed text-stone md:text-base">
              New arrivals, private edits and rituals worth keeping — delivered weekly, never more.
            </p>

            <AnimatePresence mode="wait">
              {success ? (
                <motion.div
                  key="success"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: DURATION.reveal, ease: EASE_LUXURY }}
                  className="mt-10 flex max-w-md items-center gap-3"
                >
                  <span className="flex h-10 w-10 items-center justify-center bg-gold/10 rounded-full">
                    <Check className="h-5 w-5 text-gold" aria-hidden />
                  </span>
                  <div>
                    <p className="font-serif text-lg text-ink">You&apos;re in.</p>
                    <p className="text-sm text-stone">
                      Your first letter is on its way.
                    </p>
                  </div>
                </motion.div>
              ) : (
                <motion.form
                  key="form"
                  initial={{ opacity: 1 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.3, ease: EASE_LUXURY }}
                  onSubmit={onSubmit}
                  className="mt-10 flex max-w-md flex-col gap-6"
                >
                  <div className="flex flex-col gap-1.5 text-left">
                    <label
                      htmlFor="newsletter-email"
                      className="text-[10px] font-semibold uppercase tracking-[0.25em] text-stone"
                    >
                      EMAIL
                    </label>
                    <Input
                      id="newsletter-email"
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="support@ladtradeltd.com"
                      aria-label="Email address"
                      className="h-12 border-0 border-b border-line bg-transparent px-0 text-sm text-ink transition-colors placeholder:text-stone/50 hover:border-ink/50 focus-visible:border-ink focus-visible:ring-0 focus-visible:outline-none"
                    />
                  </div>

                  <LinedButton
                    type="submit"
                    tone="ink"
                    width="w-full max-w-[280px]"
                    disabled={submitting}
                  >
                    {submitting ? "JOINING..." : "SUBSCRIBE TO THE LETTER"}
                  </LinedButton>
                </motion.form>
              )}
            </AnimatePresence>

            <p className="mt-8 max-w-md text-xs text-stone/80">
              By subscribing you agree to our privacy policy. Unsubscribe
              anytime, without ceremony.
            </p>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
