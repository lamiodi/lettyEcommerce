"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useHydrated } from "@/hooks/use-hydrated";
import { useScrollLock } from "@/hooks/use-scroll-lock";
import {
  COUNTRY_POPUP_DISMISSED_EVENT,
  COUNTRY_POPUP_DISMISSED_KEY,
} from "@/components/home/country-welcome-modal";

export const EARN_POINTS_SEEN_KEY = "letty-earn-points-seen-session";
export const EARN_POINTS_CLOSED_EVENT = "letty:earn-points-closed";

/** Loyalty teaser popup, shown first in the homepage popup chain (before the
 *  10% offer capture): "Did you know you can earn points…?" with a Learn more
 *  link into the VIP Sanctuary. */
export function EarnPointsPopup() {
  const [isOpen, setIsOpen] = useState(false);
  const hydrated = useHydrated();
  useScrollLock(isOpen);
  const router = useRouter();

  useEffect(() => {
    if (!hydrated) return;

    let seen = false;
    let countryHandled = true;
    try {
      seen = sessionStorage.getItem(EARN_POINTS_SEEN_KEY) === "1";
      countryHandled = sessionStorage.getItem(COUNTRY_POPUP_DISMISSED_KEY) === "1";
    } catch {
      /* ignore */
    }
    if (seen) return;

    let openTimer: ReturnType<typeof setTimeout> | undefined;
    const open = () => {
      setIsOpen(true);
    };

    if (countryHandled) {
      // Country modal won't appear this session — show on a short timer.
      openTimer = setTimeout(open, 6000);
      return () => clearTimeout(openTimer);
    }

    // Otherwise wait for the country modal to be confirmed/dismissed.
    const onCountryHandled = () => {
      openTimer = setTimeout(open, 1500);
    };
    window.addEventListener(COUNTRY_POPUP_DISMISSED_EVENT, onCountryHandled, { once: true });
    return () => {
      window.removeEventListener(COUNTRY_POPUP_DISMISSED_EVENT, onCountryHandled);
      clearTimeout(openTimer);
    };
  }, [hydrated]);

  const close = () => {
    try {
      sessionStorage.setItem(EARN_POINTS_SEEN_KEY, "1");
    } catch {
      /* storage unavailable */
    }
    window.dispatchEvent(new Event(EARN_POINTS_CLOSED_EVENT));
    setIsOpen(false);
  };

  const learnMore = () => {
    close();
    router.push("/vip");
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto overscroll-contain">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            onClick={close}
            className="fixed inset-0 bg-ink/60 backdrop-blur-xs"
          />

          {/* Modal Card — loyalty teaser */}
          <motion.div
            initial={{ opacity: 0, scale: 0.97, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: 16 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="relative w-full max-w-md bg-ivory shadow-2xl p-7 sm:p-9 my-auto"
          >
            <button
              type="button"
              onClick={close}
              aria-label="Close earn points popup"
              className="absolute right-3 top-3 z-30 p-2 text-stone hover:text-ink bg-white/60 hover:bg-white rounded-full transition-colors cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>

            <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-gold">
              THE INNER CIRCLE
            </p>
            <h2 className="mt-2.5 font-serif text-2xl font-medium tracking-tight text-ink leading-snug">
              Did you know you can earn points for signing up, making purchases and more?
            </h2>
            <button
              type="button"
              onClick={learnMore}
              className="mt-7 h-12 w-full bg-ink text-xs font-medium uppercase tracking-[0.22em] text-ivory transition-all duration-200 hover:bg-stone active:scale-[0.99] cursor-pointer"
            >
              Learn more
            </button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
