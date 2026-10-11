"use client";

import { useEffect, useId, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useHydrated } from "@/hooks/use-hydrated";
import { useScrollLock } from "@/hooks/use-scroll-lock";
import {
  COUNTRY_POPUP_DISMISSED_EVENT,
  COUNTRY_POPUP_DISMISSED_KEY,
} from "@/components/home/country-welcome-modal";
import { SprigSeal, WreathSeal } from "@/components/home/inner-circle-ornaments";

export const EARN_POINTS_SEEN_KEY = "letty-earn-points-seen-session";
export const EARN_POINTS_CLOSED_EVENT = "letty:earn-points-closed";

const EASE_LUXE: [number, number, number, number] = [0.22, 1, 0.36, 1];

/** Loyalty teaser popup, shown first in the homepage popup chain (before the
 *  10% offer capture): a cream certificate card — "Loyalty, Rewarded." — with
 *  a Learn more link into the VIP Sanctuary. All motion is transform/opacity
 *  only and reduced-motion aware so it stays smooth on mobile. */
export function EarnPointsPopup() {
  const [isOpen, setIsOpen] = useState(false);
  const hydrated = useHydrated();
  useScrollLock(isOpen);
  const router = useRouter();
  const reduceMotion = useReducedMotion();
  const headingId = useId();

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

  // Staggered content reveal. The exit state embeds its own transition so
  // closing is never delayed by the entrance stagger.
  const rise = (delay: number) => ({
    initial: { opacity: 0, y: reduceMotion ? 0 : 12 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, transition: { duration: 0.18 } },
    transition: { delay, duration: reduceMotion ? 0.2 : 0.45, ease: EASE_LUXE },
  });

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby={headingId}
          className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto overscroll-contain p-4 sm:p-6"
        >
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.28 } }}
            transition={{ duration: 0.35 }}
            onClick={close}
            className="fixed inset-0 bg-ink/65 backdrop-blur-xs"
          />

          <button
            type="button"
            onClick={close}
            aria-label="Close Inner Circle popup"
            className="fixed right-3 top-3 z-20 cursor-pointer p-2.5 text-ivory/70 transition-colors hover:text-ivory"
          >
            <X className="h-5 w-5" />
          </button>

          <div className="relative z-10 my-auto flex w-full max-w-md flex-col items-center">
            <motion.span
              initial={{ opacity: 0, y: reduceMotion ? 0 : -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, transition: { duration: 0.2 } }}
              transition={{ delay: 0.3, duration: 0.5, ease: EASE_LUXE }}
              className="pl-[0.4em] font-serif text-sm tracking-[0.4em] text-ivory sm:text-base [@media(max-height:620px)]:hidden"
            >
              LETTY
            </motion.span>

            {/* Modal card — loyalty certificate */}
            <motion.div
              initial={{ opacity: 0, y: reduceMotion ? 0 : 26, scale: reduceMotion ? 1 : 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{
                opacity: 0,
                y: reduceMotion ? 0 : 10,
                scale: reduceMotion ? 1 : 0.98,
                transition: { duration: 0.28, ease: EASE_LUXE },
              }}
              transition={{ duration: 0.5, ease: EASE_LUXE }}
              className="relative mt-4 w-full"
            >
              <WreathSeal className="pointer-events-none absolute -left-3 -top-4 z-20 h-16 w-16 text-gold sm:-left-7 sm:-top-7 sm:h-24 sm:w-24" />
              <SprigSeal className="pointer-events-none absolute -right-2 -top-5 z-20 w-14 text-gold sm:-right-6 sm:-top-7 sm:w-24" />

              <div className="relative bg-ivory px-6 pb-10 pt-11 text-center shadow-2xl sm:px-12 sm:pb-12 sm:pt-14">
                {/* Inset keyline frame with midpoint diamonds */}
                <div className="pointer-events-none absolute inset-2 border border-gold/55 sm:inset-3" />
                <span className="pointer-events-none absolute left-1/2 top-2 z-10 h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rotate-45 bg-gold sm:top-3" />
                <span className="pointer-events-none absolute bottom-2 left-1/2 z-10 h-1.5 w-1.5 -translate-x-1/2 translate-y-1/2 rotate-45 bg-gold sm:bottom-3" />

                <motion.p
                  {...rise(0.18)}
                  className="pl-[0.32em] text-[10px] font-semibold uppercase tracking-[0.32em] text-ink sm:text-[11px]"
                >
                  The Inner Circle
                </motion.p>

                <motion.h2
                  id={headingId}
                  {...rise(0.26)}
                  className="mt-4 font-serif text-[34px] leading-[1.05] text-ink sm:mt-5 sm:text-[44px]"
                >
                  Loyalty,
                  <span className="block text-gold">Rewarded.</span>
                </motion.h2>

                <motion.p
                  {...rise(0.34)}
                  className="mx-auto mt-4 max-w-[27ch] text-[13px] leading-relaxed text-stone sm:mt-5 sm:text-sm"
                >
                  Join our loyalty programme and enjoy exclusive member-only perks and rewards.
                </motion.p>

                <motion.button
                  {...rise(0.42)}
                  type="button"
                  onClick={learnMore}
                  whileTap={reduceMotion ? undefined : { scale: 0.98 }}
                  className="mt-8 inline-flex h-12 cursor-pointer items-center justify-center border border-gold px-12 text-[11px] font-medium uppercase tracking-[0.28em] text-stone transition-colors duration-200 hover:border-ink hover:bg-ink hover:text-ivory sm:mt-9"
                >
                  Learn more
                </motion.button>
              </div>
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
}
