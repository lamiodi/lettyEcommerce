"use client";

import Image from "next/image";
import { useEffect, useState, type FormEvent } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Check, Mail, X } from "lucide-react";
import { toast } from "sonner";
import { useHydrated } from "@/hooks/use-hydrated";
import { useScrollLock } from "@/hooks/use-scroll-lock";
import {
  EARN_POINTS_CLOSED_EVENT,
  EARN_POINTS_SEEN_KEY,
} from "@/components/home/earn-points-popup";

export const OFFER_POPUP_SEEN_KEY = "letty-offer-popup-seen-session";
export const OFFER_SUBSCRIBED_KEY = "letty-offer-subscribed-session";

/** Welcome offer popup (2026-10-11 redesign, user's Huda-style reference):
 *  hero photo on top (~40% height) + centered cream form column below —
 *  "THE LETTY LETTER" eyebrow, "10% OFF YOUR FIRST ORDER" serif headline,
 *  pill email input with envelope icon, full-width espresso JOIN button,
 *  underlined NO THANKS. Shows once per session after the earn-points
 *  popup has been handled (or directly if it was handled earlier). Outside the
 *  homepage chain (e.g. department pages) pass waitForEarnPoints={false} — the
 *  earn-points event never fires there, so the popup opens on the timer alone. */
export function OfferPopup({ waitForEarnPoints = true }: { waitForEarnPoints?: boolean }) {
  const [isOpen, setIsOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [subscribed, setSubscribed] = useState(false);
  const [imgLoaded, setImgLoaded] = useState(false);
  const hydrated = useHydrated();
  useScrollLock(isOpen);

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

    if (earnPointsHandled || !waitForEarnPoints) {
      // Earn-points popup won't appear here — show on a short timer.
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
  }, [hydrated, waitForEarnPoints]);

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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto overscroll-contain">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            onClick={() => close(false)}
            className="fixed inset-0 bg-ink/60 md:backdrop-blur-xs"
          />

          {/* Modal Card — hero photo over centered form column */}
          <motion.div
            initial={{ opacity: 0, scale: 0.97, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: 16 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="relative w-full max-w-md bg-ivory shadow-2xl overflow-hidden my-auto"
          >
            {/* Close button — over the hero photo */}
            <button
              type="button"
              onClick={() => close(false)}
              aria-label="Close offer popup"
              className="absolute right-3 top-3 z-30 p-2 text-white/90 hover:text-white transition-colors cursor-pointer"
            >
              <X className="h-4 w-4" strokeWidth={1.5} />
            </button>

            {/* Hero image */}
            <div className="relative w-full h-[230px] sm:h-[250px] bg-secondary overflow-hidden">
              <Image
                src="/images/IMG_7700.webp"
                alt="LETTY skincare — moisturiser jar styled with a botanical sprig"
                fill
                sizes="(max-width: 448px) 100vw, 448px"
                onLoad={() => setImgLoaded(true)}
                className={`object-cover object-center transition-opacity duration-500 ${
                  imgLoaded ? "opacity-100" : "opacity-0"
                }`}
                quality={80}
              />
            </div>

            {/* Form column */}
            <div className="px-7 py-9 sm:px-9 sm:py-10 flex flex-col items-center text-center">
              <div className="flex w-full items-center gap-4" aria-hidden>
                <span className="h-px flex-1 bg-stone/30" />
                <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-stone">
                  The Letty Letter
                </p>
                <span className="h-px flex-1 bg-stone/30" />
              </div>
              <h2 className="mt-4 font-serif text-[26px] sm:text-3xl font-medium uppercase leading-[1.15] tracking-wide text-ink">
                10% off your first order
              </h2>
              <p className="mt-3 text-[13px] leading-relaxed text-stone">
                Join The Letty Letter and receive 10% off your first order, plus
                exclusive access to new collections, beauty rituals, fragrance
                launches and more.
              </p>

              {subscribed ? (
                <div className="mt-7 flex flex-col items-center">
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-gold/10">
                    <Check className="h-5 w-5 text-gold" aria-hidden />
                  </span>
                  <p className="mt-3 font-serif text-xl text-ink">You&apos;re in.</p>
                  <p className="mt-1 text-xs leading-relaxed text-stone">
                    Your welcome offer is on its way to your inbox.
                  </p>
                  <button
                    type="button"
                    onClick={() => close(true)}
                    className="mt-4 text-[11px] font-medium uppercase tracking-luxe text-ink underline underline-offset-4 hover:text-stone cursor-pointer"
                  >
                    Continue Shopping
                  </button>
                </div>
              ) : (
                <form onSubmit={onSubmit} className="mt-7 w-full space-y-3">
                  <div className="relative">
                    <Mail
                      className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-stone/60"
                      strokeWidth={1.5}
                      aria-hidden
                    />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="EMAIL ADDRESS"
                      aria-label="Email address"
                      className="h-12 w-full rounded-full border border-ink/20 bg-white/70 pl-11 pr-5 text-sm text-ink placeholder:text-[11px] placeholder:uppercase placeholder:tracking-[0.18em] placeholder:text-stone/60 focus:border-ink focus:outline-none focus:ring-1 focus:ring-ink"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="group flex h-12 w-full items-center justify-center gap-2 rounded-full bg-ink text-[11px] font-medium uppercase tracking-[0.22em] text-ivory transition-all duration-200 hover:bg-stone active:scale-[0.99] disabled:opacity-50 cursor-pointer"
                  >
                    {submitting ? "SUBSCRIBING..." : "Join The Letty Letter"}
                    {!submitting && (
                      <ArrowRight
                        className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-0.5"
                        strokeWidth={1.5}
                        aria-hidden
                      />
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => close(false)}
                    className="mx-auto block pt-1 text-[10px] uppercase tracking-luxe text-stone/80 underline underline-offset-4 decoration-stone/40 hover:text-ink transition-colors cursor-pointer"
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
