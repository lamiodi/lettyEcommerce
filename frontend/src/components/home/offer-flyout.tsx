"use client";

import { useEffect, useState, type FormEvent } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check, X } from "lucide-react";
import { toast } from "sonner";
import { useHydrated } from "@/hooks/use-hydrated";
import {
  OFFER_POPUP_CLOSED_EVENT,
  OFFER_POPUP_SEEN_KEY,
  OFFER_SUBSCRIBED_KEY,
} from "@/components/home/offer-popup";

const FLYOUT_SEEN_KEY = "letty-offer-flyout-seen-session";

/** Kai Collective-style corner flyout: the same "10% off your first order"
 *  capture in a compact bottom-right card. Appears once the main offer popup
 *  has been closed (or on a fallback timer if it was handled earlier in the
 *  session). Sits above the WhatsApp widget. */
export function OfferFlyout() {
  const [isOpen, setIsOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [subscribed, setSubscribed] = useState(false);
  const hydrated = useHydrated();

  useEffect(() => {
    if (!hydrated) return;

    let seen = false;
    let subscribed = false;
    let popupSeen = false;
    try {
      seen = sessionStorage.getItem(FLYOUT_SEEN_KEY) === "1";
      subscribed = sessionStorage.getItem(OFFER_SUBSCRIBED_KEY) === "1";
      popupSeen = sessionStorage.getItem(OFFER_POPUP_SEEN_KEY) === "1";
    } catch {
      /* ignore */
    }
    if (seen || subscribed) return;

    let openTimer: ReturnType<typeof setTimeout> | undefined;
    const open = () => {
      try {
        sessionStorage.setItem(FLYOUT_SEEN_KEY, "1");
      } catch {
        /* ignore */
      }
      setIsOpen(true);
    };

    if (popupSeen) {
      // Offer popup was already handled earlier this session — fallback timer.
      openTimer = setTimeout(open, 12000);
      return () => clearTimeout(openTimer);
    }

    // Otherwise appear shortly after the offer popup closes.
    const onPopupClosed = (e: Event) => {
      const didSubscribe = (e as CustomEvent<{ didSubscribe: boolean }>).detail?.didSubscribe;
      if (didSubscribe) return;
      openTimer = setTimeout(open, 1500);
    };
    window.addEventListener(OFFER_POPUP_CLOSED_EVENT, onPopupClosed, { once: true });
    return () => {
      window.removeEventListener(OFFER_POPUP_CLOSED_EVENT, onPopupClosed);
      clearTimeout(openTimer);
    };
  }, [hydrated]);

  const close = (didSubscribe: boolean) => {
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
        body: JSON.stringify({ email: email.trim(), source: "popup_flyout" }),
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
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 24 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          role="dialog"
          aria-label="First order offer"
          className="fixed bottom-24 right-4 sm:right-6 z-40 w-[calc(100vw-2rem)] max-w-sm border border-line bg-ivory p-5 shadow-2xl print:hidden"
        >
          <button
            type="button"
            onClick={() => close(false)}
            aria-label="Close offer"
            className="absolute right-2.5 top-2.5 p-1.5 text-stone hover:text-ink rounded-full transition-colors cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>

          <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-gold">
            THE LETTY LETTER
          </p>
          <h3 className="mt-1.5 font-serif text-xl font-medium tracking-tight text-ink">
            10% off your first order
          </h3>
          <p className="mt-1 text-xs text-stone">Enter your email to enjoy.</p>

          {subscribed ? (
            <div className="mt-4 flex items-center gap-2.5">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gold/10">
                <Check className="h-4 w-4 text-gold" aria-hidden />
              </span>
              <p className="text-xs leading-relaxed text-stone">
                You&apos;re in. Your welcome offer is on its way to your inbox.
              </p>
            </div>
          ) : (
            <form onSubmit={onSubmit} className="mt-4 space-y-2.5">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email address"
                aria-label="Email address"
                className="h-11 w-full rounded-full border border-ink/30 bg-white px-4 text-sm text-ink placeholder:text-stone/60 focus:border-ink focus:outline-none focus:ring-1 focus:ring-ink"
              />
              <button
                type="submit"
                disabled={submitting}
                className="h-11 w-full rounded-full bg-ink text-xs font-medium uppercase tracking-[0.22em] text-ivory transition-all duration-200 hover:bg-stone active:scale-[0.99] disabled:opacity-50 cursor-pointer"
              >
                {submitting ? "SUBSCRIBING..." : "SUBSCRIBE"}
              </button>
            </form>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
