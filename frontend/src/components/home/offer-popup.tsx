"use client";

import Image from "next/image";
import { useEffect, useState, type FormEvent } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check, X } from "lucide-react";
import { toast } from "sonner";
import { useHydrated } from "@/hooks/use-hydrated";
import {
  EARN_POINTS_CLOSED_EVENT,
  EARN_POINTS_SEEN_KEY,
} from "@/components/home/earn-points-popup";

export const OFFER_POPUP_SEEN_KEY = "letty-offer-popup-seen-session";
export const OFFER_SUBSCRIBED_KEY = "letty-offer-subscribed-session";
export const OFFER_POPUP_CLOSED_EVENT = "letty:offer-popup-closed";

/** Kai Collective-style welcome offer popup: split editorial image + "10% off
 *  your first order" email capture. Shows once per session after the earn-points
 *  popup has been handled (or directly if it was handled earlier). */
export function OfferPopup() {
  const [isOpen, setIsOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [subscribed, setSubscribed] = useState(false);
  const hydrated = useHydrated();

  useEffect(() => {
    if (!hydrated) return;

    let seen = false;
    let subscribed = false;
    let earnPointsHandled = true;
    try {
      seen = sessionStorage.getItem(OFFER_POPUP_SEEN_KEY) === "1";
      subscribed = sessionStorage.getItem(OFFER_SUBSCRIBED_KEY) === "1";
      earnPointsHandled = sessionStorage.getItem(EARN_POINTS_SEEN_KEY) === "1";
    } catch {
      /* ignore */
    }
    if (seen || subscribed) return;

    let openTimer: ReturnType<typeof setTimeout> | undefined;
    const open = () => {
      setIsOpen(true);
    };

    if (earnPointsHandled) {
      // Earn-points popup won't appear this session — show on a short timer.
      openTimer = setTimeout(open, 6000);
      return () => clearTimeout(openTimer);
    }

    // Otherwise wait for the earn-points popup to be closed.
    const onEarnPointsClosed = () => {
      openTimer = setTimeout(open, 1500);
    };
    window.addEventListener(EARN_POINTS_CLOSED_EVENT, onEarnPointsClosed, { once: true });
    return () => {
      window.removeEventListener(EARN_POINTS_CLOSED_EVENT, onEarnPointsClosed);
      clearTimeout(openTimer);
    };
  }, [hydrated]);

  const close = (didSubscribe: boolean) => {
    try {
      sessionStorage.setItem(OFFER_POPUP_SEEN_KEY, "1");
    } catch {
      /* storage unavailable */
    }
    try {
      if (didSubscribe) {
        sessionStorage.setItem(OFFER_SUBSCRIBED_KEY, "1");
      }
    } catch {
      /* ignore */
    }
    window.dispatchEvent(new CustomEvent(OFFER_POPUP_CLOSED_EVENT, { detail: { didSubscribe } }));
    setIsOpen(false);
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!email.includes("@")) {
      toast.error("Please enter a valid email address.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), source: "popup_offer" }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error || "Subscription failed");
      }
      setSubscribed(true);
      toast.success("Welcome to the maison. Your offer is on its way.");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to subscribe. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            onClick={() => close(false)}
            className="fixed inset-0 bg-ink/60 backdrop-blur-xs"
          />

          {/* Modal Card — split editorial image / offer form */}
          <motion.div
            initial={{ opacity: 0, scale: 0.97, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: 16 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="relative w-full max-w-2xl bg-ivory shadow-2xl overflow-hidden flex flex-col sm:flex-row my-auto"
          >
            {/* Close button */}
            <button
              type="button"
              onClick={() => close(false)}
              aria-label="Close offer popup"
              className="absolute right-3 top-3 z-30 p-2 text-stone hover:text-ink bg-white/60 hover:bg-white rounded-full transition-colors cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>

            {/* Editorial image — banner on mobile, left column on desktop */}
            <div className="relative w-full sm:w-1/2 h-44 sm:h-auto sm:min-h-[420px] bg-secondary shrink-0 overflow-hidden">
              <Image
                src="/images/IMG_7446.webp"
                alt="LETTY skincare ritual — Radiant Face Cream, Brightening Face Serum, Gentle Face Cleanser and Balancing Face Toner"
                fill
                sizes="(max-width: 640px) 100vw, 360px"
                className="object-cover object-center"
                quality={80}
              />
            </div>

            {/* Offer form */}
            <div className="flex-1 px-6 py-8 sm:px-8 sm:py-10 flex flex-col justify-center text-left">
              <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-gold">
                THE LETTY LETTER
              </p>
              <h2 className="mt-2 font-serif text-3xl font-medium tracking-tight text-ink leading-tight">
                10% off your first order
              </h2>
              <p className="mt-2 text-sm text-stone">Enter your email to enjoy.</p>

              {subscribed ? (
                <div className="mt-7 flex items-start gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gold/10">
                    <Check className="h-4 w-4 text-gold" aria-hidden />
                  </span>
                  <div>
                    <p className="font-serif text-lg text-ink">You&apos;re in.</p>
                    <p className="mt-0.5 text-xs leading-relaxed text-stone">
                      Your welcome offer is on its way to your inbox.
                    </p>
                    <button
                      type="button"
                      onClick={() => close(true)}
                      className="mt-3 text-[11px] font-medium uppercase tracking-luxe text-ink underline underline-offset-4 hover:text-stone cursor-pointer"
                    >
                      Continue Shopping
                    </button>
                  </div>
                </div>
              ) : (
                <form onSubmit={onSubmit} className="mt-7 space-y-3">
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Email address"
                    aria-label="Email address"
                    className="h-12 w-full rounded-full border border-ink/30 bg-white px-5 text-sm text-ink placeholder:text-stone/60 focus:border-ink focus:outline-none focus:ring-1 focus:ring-ink"
                  />
                  <button
                    type="submit"
                    disabled={submitting}
                    className="h-12 w-full rounded-full bg-ink text-xs font-medium uppercase tracking-[0.22em] text-ivory transition-all duration-200 hover:bg-stone active:scale-[0.99] disabled:opacity-50 cursor-pointer"
                  >
                    {submitting ? "SUBSCRIBING..." : "SUBSCRIBE"}
                  </button>
                  <button
                    type="button"
                    onClick={() => close(false)}
                    className="mx-auto block pt-1 text-[10px] uppercase tracking-luxe text-stone/80 hover:text-ink transition-colors cursor-pointer"
                  >
                    No thanks
                  </button>
                </form>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
